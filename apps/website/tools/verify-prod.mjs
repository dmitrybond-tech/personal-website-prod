#!/usr/bin/env node

/**
 * Production Asset Verification Tool
 * 
 * Verifies that all static assets are accessible on the production website
 * by fetching key pages and checking asset URLs.
 * 
 * Usage: node tools/verify-prod.mjs [--base-url=https://dmitrybond.tech] [--verbose] [--concurrency=5]
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const args = process.argv.slice(2);
const baseUrl = args.find(arg => arg.startsWith('--base-url='))?.split('=')[1] || 'https://dmitrybond.tech';
const verbose = args.includes('--verbose');
const concurrency = parseInt(args.find(arg => arg.startsWith('--concurrency='))?.split('=')[1] || '5');
const timeout = parseInt(args.find(arg => arg.startsWith('--timeout='))?.split('=')[1] || '10000');

// Pages to test
const TEST_PAGES = [
  '/',
  '/en/about',
  '/ru/about',
  '/en',
  '/ru'
];

// Asset URL patterns to extract from HTML
const ASSET_PATTERNS = [
  // CSS links
  { regex: /<link[^>]+href=["']([^"']+)["'][^>]*>/g, type: 'css' },
  // Script sources
  { regex: /<script[^>]+src=["']([^"']+)["'][^>]*>/g, type: 'js' },
  // Image sources
  { regex: /<img[^>]+src=["']([^"']+)["'][^>]*>/g, type: 'img' },
  // Background images in style attributes
  { regex: /style=["'][^"']*background-image:\s*url\(["']?([^"']+)["']?\)[^"']*["']/g, type: 'bg-img' },
  // CSS @font-face src
  { regex: /@font-face\s*\{[^}]*src:\s*url\(["']?([^"']+)["']?\)[^}]*\}/g, type: 'font' },
  // Favicon links
  { regex: /<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["'][^>]*>/g, type: 'favicon' },
  // Manifest links
  { regex: /<link[^>]+rel=["']manifest["'][^>]+href=["']([^"']+)["'][^>]*>/g, type: 'manifest' }
];

// External URL patterns to skip
const EXTERNAL_PATTERNS = [
  /^https?:\/\//,
  /^\/\//,
  /^data:/,
  /^blob:/
];

class ProductionVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.verifiedAssets = new Set();
    this.failedAssets = new Set();
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (level === 'error') {
      console.error(`${prefix} ${message}`);
    } else if (level === 'warning') {
      console.warn(`${prefix} ${message}`);
    } else if (verbose || level !== 'info') {
      console.log(`${prefix} ${message}`);
    }
  }

  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async fetchPage(url) {
    try {
      this.log(`Fetching page: ${url}`);
      const response = await this.fetchWithTimeout(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const content = await response.text();
      this.log(`✓ Page loaded successfully (${content.length} bytes)`);
      return content;
    } catch (error) {
      this.errors.push(`Failed to fetch page ${url}: ${error.message}`);
      return null;
    }
  }

  extractAssetUrls(htmlContent, baseUrl) {
    const assets = [];
    
    for (const pattern of ASSET_PATTERNS) {
      let match;
      while ((match = pattern.regex.exec(htmlContent)) !== null) {
        const url = match[1];
        
        // Skip external URLs
        if (EXTERNAL_PATTERNS.some(pattern => pattern.test(url))) {
          continue;
        }
        
        // Convert relative URLs to absolute
        let absoluteUrl;
        if (url.startsWith('/')) {
          absoluteUrl = `${baseUrl}${url}`;
        } else {
          absoluteUrl = `${baseUrl}/${url}`;
        }
        
        assets.push({
          url: absoluteUrl,
          relativeUrl: url,
          type: pattern.type,
          originalUrl: url
        });
      }
    }
    
    return assets;
  }

  async verifyAsset(asset) {
    this.stats.total++;
    
    try {
      this.log(`Checking asset: ${asset.relativeUrl}`, 'info');
      
      const response = await this.fetchWithTimeout(asset.url, {
        method: 'HEAD' // Use HEAD to avoid downloading content
      });
      
      if (response.ok) {
        this.verifiedAssets.add(asset.relativeUrl);
        this.stats.success++;
        this.log(`✓ ${asset.relativeUrl} (${response.status})`);
        return true;
      } else {
        this.failedAssets.add(asset.relativeUrl);
        this.stats.failed++;
        this.errors.push(`Asset failed: ${asset.relativeUrl} (HTTP ${response.status})`);
        return false;
      }
    } catch (error) {
      this.failedAssets.add(asset.relativeUrl);
      this.stats.failed++;
      this.errors.push(`Asset error: ${asset.relativeUrl} - ${error.message}`);
      return false;
    }
  }

  async verifyAssetsConcurrently(assets) {
    const results = [];
    const chunks = [];
    
    // Split assets into chunks for concurrent processing
    for (let i = 0; i < assets.length; i += concurrency) {
      chunks.push(assets.slice(i, i + concurrency));
    }
    
    for (const chunk of chunks) {
      const promises = chunk.map(asset => this.verifyAsset(asset));
      const chunkResults = await Promise.allSettled(promises);
      results.push(...chunkResults);
      
      // Small delay between chunks to avoid overwhelming the server
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  async verifyPage(pagePath) {
    const url = `${baseUrl}${pagePath}`;
    this.log(`\n=== Verifying page: ${pagePath} ===`);
    
    const content = await this.fetchPage(url);
    if (!content) {
      return;
    }
    
    const assets = this.extractAssetUrls(content, baseUrl);
    this.log(`Found ${assets.length} assets on ${pagePath}`);
    
    if (assets.length === 0) {
      this.warnings.push(`No assets found on page: ${pagePath}`);
      return;
    }
    
    // Verify assets concurrently
    await this.verifyAssetsConcurrently(assets);
  }

  async verifyCommonAssets() {
    this.log('\n=== Verifying common static assets ===');
    
    const commonAssets = [
      '/favicons/favicon.ico',
      '/favicons/favicon-16x16.png',
      '/favicons/favicon-32x32.png',
      '/favicons/apple-touch-icon.png',
      '/favicons/android-chrome-192x192.png',
      '/favicons/android-chrome-512x512.png',
      '/favicons/manifest.webmanifest',
      '/fonts/Inter-roman.var.woff2',
      '/uploads/placeholders/avatar.png'
    ];
    
    const assets = commonAssets.map(asset => ({
      url: `${baseUrl}${asset}`,
      relativeUrl: asset,
      type: 'static',
      originalUrl: asset
    }));
    
    await this.verifyAssetsConcurrently(assets);
  }

  async run() {
    this.log('Starting production asset verification...');
    this.log(`Base URL: ${baseUrl}`);
    this.log(`Concurrency: ${concurrency}`);
    this.log(`Timeout: ${timeout}ms`);
    
    try {
      // Verify test pages
      for (const page of TEST_PAGES) {
        await this.verifyPage(page);
      }
      
      // Verify common static assets
      await this.verifyCommonAssets();
      
    } catch (error) {
      this.errors.push(`Verification failed: ${error.message}`);
    }

    return this.report();
  }

  report() {
    this.log('\n=== PRODUCTION VERIFICATION REPORT ===');
    this.log(`Total assets checked: ${this.stats.total}`);
    this.log(`Successful: ${this.stats.success}`);
    this.log(`Failed: ${this.stats.failed}`);
    this.log(`Skipped: ${this.stats.skipped}`);
    
    const successRate = this.stats.total > 0 ? (this.stats.success / this.stats.total * 100).toFixed(1) : 0;
    this.log(`Success rate: ${successRate}%`);

    if (this.errors.length > 0) {
      this.log('\n❌ ERRORS:', 'error');
      this.errors.forEach(error => this.log(`  ${error}`, 'error'));
    }

    if (this.warnings.length > 0) {
      this.log('\n⚠️  WARNINGS:', 'warning');
      this.warnings.forEach(warning => this.log(`  ${warning}`, 'warning'));
    }

    if (this.failedAssets.size > 0) {
      this.log('\n🔍 FAILED ASSETS:', 'error');
      Array.from(this.failedAssets).forEach(asset => this.log(`  ${asset}`, 'error'));
    }

    if (this.stats.failed === 0 && this.errors.length === 0) {
      this.log('\n✅ All production assets verified successfully!');
    } else {
      this.log(`\n❌ Verification failed: ${this.stats.failed} assets failed, ${this.errors.length} errors`);
    }

    return {
      success: this.stats.failed === 0 && this.errors.length === 0,
      stats: this.stats,
      errors: this.errors,
      warnings: this.warnings,
      failedAssets: Array.from(this.failedAssets)
    };
  }
}

// Main execution
async function main() {
  const verifier = new ProductionVerifier();
  const result = await verifier.run();
  
  process.exit(result.success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Production verification failed:', error);
    process.exit(1);
  });
}

export { ProductionVerifier };

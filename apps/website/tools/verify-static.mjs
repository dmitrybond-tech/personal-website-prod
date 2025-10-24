#!/usr/bin/env node

/**
 * Static Asset Verification Tool
 * 
 * Verifies that all static assets referenced in built HTML files exist
 * in the dist/client directory and are properly accessible.
 * 
 * Usage: node tools/verify-static.mjs [--dist-dir=dist/client] [--verbose]
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { promisify } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const args = process.argv.slice(2);
const distDir = args.find(arg => arg.startsWith('--dist-dir='))?.split('=')[1] || 'dist/client';
const verbose = args.includes('--verbose');
const startServer = args.includes('--server');

const DIST_PATH = resolve(__dirname, '..', distDir);

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

// MIME type mapping for common file extensions
const MIME_TYPES = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.jsx': 'application/javascript',
  '.ts': 'application/javascript',
  '.tsx': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain'
};

class AssetVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.verifiedAssets = new Set();
    this.server = null;
    this.serverPort = 0;
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

  async findHtmlFiles() {
    const htmlFiles = [];
    
    const scanDir = async (dir) => {
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.html')) {
            htmlFiles.push(fullPath);
          }
        }
      } catch (error) {
        this.log(`Warning: Could not scan directory ${dir}: ${error.message}`, 'warning');
      }
    };

    await scanDir(DIST_PATH);
    return htmlFiles;
  }

  extractAssetUrls(htmlContent) {
    const assets = [];
    
    for (const pattern of ASSET_PATTERNS) {
      let match;
      while ((match = pattern.regex.exec(htmlContent)) !== null) {
        const url = match[1];
        
        // Skip external URLs
        if (EXTERNAL_PATTERNS.some(pattern => pattern.test(url))) {
          continue;
        }
        
        // Normalize URL (remove leading slash, handle query params)
        const normalizedUrl = url.replace(/^\//, '').split('?')[0];
        
        assets.push({
          url: normalizedUrl,
          type: pattern.type,
          originalUrl: url
        });
      }
    }
    
    return assets;
  }

  async checkFileExists(filePath) {
    try {
      const stats = await stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  async getMimeType(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    return MIME_TYPES[`.${ext}`] || 'application/octet-stream';
  }

  async startTestServer() {
    if (!startServer) return null;

    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => {
        const filePath = join(DIST_PATH, req.url.replace(/^\//, ''));
        
        readFile(filePath).then(content => {
          const mimeType = this.getMimeType(filePath);
          res.writeHead(200, {
            'Content-Type': mimeType,
            'Content-Length': content.length
          });
          res.end(content);
        }).catch(() => {
          res.writeHead(404);
          res.end('Not Found');
        });
      });

      this.server.listen(0, '127.0.0.1', () => {
        this.serverPort = this.server.address().port;
        this.log(`Test server started on port ${this.serverPort}`);
        resolve(this.server);
      });

      this.server.on('error', reject);
    });
  }

  async stopTestServer() {
    if (this.server) {
      await promisify(this.server.close.bind(this.server))();
      this.server = null;
    }
  }

  async verifyAsset(asset) {
    const filePath = join(DIST_PATH, asset.url);
    const exists = await this.checkFileExists(filePath);
    
    if (!exists) {
      this.errors.push(`Missing asset: ${asset.url} (${asset.type})`);
      return false;
    }

    this.verifiedAssets.add(asset.url);
    
    // If server is running, also test HTTP access
    if (this.server && startServer) {
      try {
        const response = await fetch(`http://127.0.0.1:${this.serverPort}/${asset.url}`);
        if (!response.ok) {
          this.warnings.push(`HTTP ${response.status} for asset: ${asset.url}`);
        }
      } catch (error) {
        this.warnings.push(`HTTP error for asset: ${asset.url} - ${error.message}`);
      }
    }

    return true;
  }

  async verifyHtmlFile(htmlFile) {
    this.log(`Verifying HTML file: ${htmlFile.replace(DIST_PATH, '')}`);
    
    try {
      const content = await readFile(htmlFile, 'utf-8');
      const assets = this.extractAssetUrls(content);
      
      this.log(`Found ${assets.length} assets in ${htmlFile.replace(DIST_PATH, '')}`);
      
      for (const asset of assets) {
        await this.verifyAsset(asset);
      }
    } catch (error) {
      this.errors.push(`Failed to read HTML file ${htmlFile}: ${error.message}`);
    }
  }

  async verifyPublicAssets() {
    this.log('Verifying public assets are copied to dist/client...');
    
    const publicDir = join(__dirname, '..', 'public');
    const distPublicDir = join(DIST_PATH);
    
    try {
      const scanPublicDir = async (dir, relativePath = '') => {
        const entries = await readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const publicPath = join(dir, entry.name);
          const distPath = join(distPublicDir, relativePath, entry.name);
          
          if (entry.isDirectory()) {
            await scanPublicDir(publicPath, join(relativePath, entry.name));
          } else if (entry.isFile()) {
            const exists = await this.checkFileExists(distPath);
            if (!exists) {
              this.errors.push(`Public asset not copied: ${join(relativePath, entry.name)}`);
            } else {
              this.verifiedAssets.add(join(relativePath, entry.name));
            }
          }
        }
      };

      await scanPublicDir(publicDir);
    } catch (error) {
      this.warnings.push(`Could not verify public assets: ${error.message}`);
    }
  }

  async run() {
    this.log('Starting static asset verification...');
    this.log(`Dist directory: ${DIST_PATH}`);
    
    // Check if dist directory exists
    try {
      await stat(DIST_PATH);
    } catch {
      this.errors.push(`Dist directory not found: ${DIST_PATH}`);
      return this.report();
    }

    // Start test server if requested
    if (startServer) {
      await this.startTestServer();
    }

    try {
      // Find and verify HTML files
      const htmlFiles = await this.findHtmlFiles();
      this.log(`Found ${htmlFiles.length} HTML files`);
      
      for (const htmlFile of htmlFiles) {
        await this.verifyHtmlFile(htmlFile);
      }

      // Verify public assets are copied
      await this.verifyPublicAssets();

      // Check for common static asset directories
      const staticDirs = ['_astro', 'uploads', 'fonts', 'favicons', 'logos'];
      for (const dir of staticDirs) {
        const dirPath = join(DIST_PATH, dir);
        try {
          await stat(dirPath);
          this.log(`✓ Static directory exists: ${dir}`);
        } catch {
          this.warnings.push(`Static directory not found: ${dir}`);
        }
      }

    } finally {
      await this.stopTestServer();
    }

    return this.report();
  }

  report() {
    this.log('\n=== VERIFICATION REPORT ===');
    this.log(`Verified assets: ${this.verifiedAssets.size}`);
    this.log(`Errors: ${this.errors.length}`);
    this.log(`Warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      this.log('\n❌ ERRORS:', 'error');
      this.errors.forEach(error => this.log(`  ${error}`, 'error'));
    }

    if (this.warnings.length > 0) {
      this.log('\n⚠️  WARNINGS:', 'warning');
      this.warnings.forEach(warning => this.log(`  ${warning}`, 'warning'));
    }

    if (this.errors.length === 0) {
      this.log('\n✅ All assets verified successfully!');
    }

    return {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      verifiedAssets: this.verifiedAssets.size
    };
  }
}

// Main execution
async function main() {
  const verifier = new AssetVerifier();
  const result = await verifier.run();
  
  process.exit(result.success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

export { AssetVerifier };

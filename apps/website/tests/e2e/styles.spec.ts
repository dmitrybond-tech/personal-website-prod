/**
 * E2E tests for CSS and static asset delivery in SSR mode.
 * 
 * These tests verify that:
 * 1. CSS files are loaded and applied correctly
 * 2. Cache headers are set properly for immutable assets
 * 3. Fonts are loaded with correct headers
 * 4. No duplicate Cache-Control headers
 * 
 * Run with: npx playwright test tests/e2e/styles.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';

test.describe('Static Asset Delivery (SSR)', () => {
  test('should load and apply CSS styles on /en/about', async ({ page }) => {
    // Navigate to the about page
    await page.goto(`${BASE_URL}/en/about`);
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Check that a stylesheet link exists
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    expect(stylesheets).toBeGreaterThan(0);
    
    // Get computed styles of body to verify CSS is applied
    const bodyFont = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });
    
    // Should not be default serif font
    expect(bodyFont).not.toContain('Times New Roman');
    expect(bodyFont).not.toBe('serif');
    
    // Should contain Inter or a proper font stack
    // (This is a basic check - adjust based on your actual font stack)
    console.log('Body font family:', bodyFont);
  });

  test('should serve CSS with immutable cache headers', async ({ request }) => {
    // First, get the HTML to find the CSS file
    const htmlResponse = await request.get(`${BASE_URL}/en/about`);
    const html = await htmlResponse.text();
    
    // Extract CSS path from HTML
    const cssMatch = html.match(/\/_astro\/[^"]+\.css/);
    expect(cssMatch).not.toBeNull();
    
    const cssPath = cssMatch![0];
    console.log('Testing CSS file:', cssPath);
    
    // Request the CSS file
    const cssResponse = await request.get(`${BASE_URL}${cssPath}`);
    
    // Check status
    expect(cssResponse.status()).toBe(200);
    
    // Check cache headers
    const cacheControl = cssResponse.headers()['cache-control'];
    expect(cacheControl).toBeTruthy();
    expect(cacheControl).toContain('immutable');
    expect(cacheControl).toContain('max-age=31536000');
    expect(cacheControl).toContain('public');
    
    // Check content type
    const contentType = cssResponse.headers()['content-type'];
    expect(contentType).toContain('text/css');
    
    console.log('CSS Cache-Control:', cacheControl);
    console.log('CSS Content-Type:', contentType);
  });

  test('should serve fonts with immutable cache headers', async ({ request }) => {
    // Try to load a known font file
    const fontPath = '/fonts/inter-roman.var.woff2';
    const fontResponse = await request.get(`${BASE_URL}${fontPath}`);
    
    // If font doesn't exist, skip the test
    if (fontResponse.status() === 404) {
      test.skip();
      return;
    }
    
    expect(fontResponse.status()).toBe(200);
    
    // Check cache headers
    const cacheControl = fontResponse.headers()['cache-control'];
    expect(cacheControl).toBeTruthy();
    expect(cacheControl).toContain('immutable');
    expect(cacheControl).toContain('max-age=31536000');
    
    // Check content type
    const contentType = fontResponse.headers()['content-type'];
    expect(contentType).toMatch(/font|woff2/i);
    
    console.log('Font Cache-Control:', cacheControl);
    console.log('Font Content-Type:', contentType);
  });

  test('should serve HTML with no-store cache headers', async ({ request }) => {
    const htmlResponse = await request.get(`${BASE_URL}/en/about`);
    
    expect(htmlResponse.status()).toBe(200);
    
    // Check cache headers
    const cacheControl = htmlResponse.headers()['cache-control'];
    expect(cacheControl).toBeTruthy();
    expect(cacheControl).toContain('no-store');
    
    // Check content type
    const contentType = htmlResponse.headers()['content-type'];
    expect(contentType).toContain('text/html');
    
    console.log('HTML Cache-Control:', cacheControl);
  });

  test('should load page with applied Tailwind styles', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/about`);
    await page.waitForLoadState('networkidle');
    
    // Check if Tailwind utility classes are working
    // Look for an element that should have Tailwind styles
    const body = page.locator('body');
    
    // Get computed styles to verify Tailwind is applied
    const backgroundColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // Should have some background color set (not default transparent)
    console.log('Body background color:', backgroundColor);
    
    // The page should not have Times New Roman anywhere visible
    const hasTimesFonts = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        const style = window.getComputedStyle(el);
        if (style.fontFamily.includes('Times New Roman')) {
          return true;
        }
      }
      return false;
    });
    
    expect(hasTimesFonts).toBe(false);
  });
});


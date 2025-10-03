#!/usr/bin/env node

/**
 * CMS Inventory Script - Read-Only Content Analysis
 * 
 * Scans existing Markdown/MDX files, parses frontmatter, and outputs:
 * - Normalized content inventory
 * - Proposed Decap CMS configuration
 * - Optional JSON snapshot preview
 * 
 * Requirements: Node.js ≥ 18, ESM only, read-only operation
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fastGlob from 'fast-glob';
import matter from 'gray-matter';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Node.js version check
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
  console.error(`Error: Node.js 18+ required, got ${nodeVersion}`);
  process.exit(1);
}

// Safety guard - ensure no file writes
const SAFETY_GUARD = `
// SAFETY GUARD: This script is read-only
// If you see this comment, the script has been modified to write files
// This is not allowed in the CMS inventory script
`;

// Validation schemas
const AboutSectionSchema = z.object({
  type: z.enum(['hero', 'skills', 'experience', 'education', 'favorites']),
  data: z.record(z.any())
});

const AboutPageSchema = z.object({
  title: z.string(),
  slug: z.string(),
  cv_pdf: z.string().optional(),
  sections: z.array(AboutSectionSchema)
});

const BlogPostSchema = z.object({
  title: z.string(),
  date: z.string().optional(),
  publishedAt: z.string().optional(),
  description: z.string().optional(),
  draft: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  lang: z.string().optional(),
  locale: z.string().optional()
});

// CLI argument parsing
const argv = yargs(hideBin(process.argv))
  .option('root', {
    type: 'string',
    default: 'apps/website',
    description: 'Repository root to scan'
  })
  .option('globs', {
    type: 'array',
    default: ['**/*.md', '**/*.mdx'],
    description: 'Glob patterns for file matching'
  })
  .option('yaml', {
    type: 'boolean',
    default: false,
    description: 'Additionally print YAML Decap collections snippet'
  })
  .option('only', {
    type: 'string',
    choices: ['about', 'blog', 'all'],
    default: 'all',
    description: 'Filter which collections to propose'
  })
  .option('limit', {
    type: 'number',
    description: 'Cap files processed for speed'
  })
  .option('pretty', {
    type: 'boolean',
    default: false,
    description: 'Pretty-print JSON output'
  })
  .option('logLevel', {
    type: 'string',
    choices: ['info', 'debug'],
    default: 'info',
    description: 'Logging level'
  })
  .help()
  .parseSync();

// Logging utility
function log(level, message, data = null) {
  if (level === 'debug' && argv.logLevel !== 'debug') return;
  if (level === 'info' && argv.logLevel === 'debug') {
    console.error(`[${level.toUpperCase()}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  } else if (level === 'debug') {
    console.error(`[${level.toUpperCase()}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

// Normalize frontmatter keys
function normalizeFrontmatter(frontmatter, filePath) {
  const normalized = { ...frontmatter };
  
  // Locale detection
  if (!normalized.locale && !normalized.lang && !normalized.language) {
    if (filePath.includes('/en/') || filePath.includes('.en.')) {
      normalized.locale = 'en';
    } else if (filePath.includes('/ru/') || filePath.includes('.ru.')) {
      normalized.locale = 'ru';
    }
  } else {
    normalized.locale = normalized.locale || normalized.lang || normalized.language;
  }
  
  // Route/slug detection
  if (!normalized.route && !normalized.permalink && !normalized.slug && !normalized.path) {
    if (normalized.locale) {
      normalized.route = `/${normalized.locale}${filePath.includes('about') ? '/about' : ''}`;
    }
  } else {
    normalized.route = normalized.route || normalized.permalink || normalized.slug || normalized.path;
  }
  
  // Title normalization
  normalized.title = normalized.title || normalized.name || normalized.heading || 'Untitled';
  
  // Hero image detection
  if (normalized.sections && Array.isArray(normalized.sections)) {
    const heroSection = normalized.sections.find(s => s.type === 'hero');
    if (heroSection && heroSection.data) {
      normalized.hero = {
        image: heroSection.data.avatar || heroSection.data.image || heroSection.data.cover,
        heading: heroSection.data.name || heroSection.data.title,
        subheading: heroSection.data.bio || heroSection.data.description
      };
    }
  }
  
  return normalized;
}

// Detect content type
function detectContentType(normalized, filePath) {
  // About page detection
  if (normalized.slug && (normalized.slug.includes('about') || filePath.includes('about'))) {
    return normalized.locale === 'ru' ? 'about_ru' : 'about_en';
  }
  
  // Blog detection
  if (filePath.includes('blog') || filePath.includes('posts') || 
      normalized.route?.includes('/blog') || 
      normalized.tags || normalized.date || normalized.publishedAt) {
    return 'blog';
  }
  
  return 'unknown';
}

// Extract images from content
function extractImages(content, frontmatter) {
  const images = new Set();
  
  // Extract from markdown
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    images.add(match[1]);
  }
  
  // Extract from frontmatter
  if (frontmatter.hero?.image) images.add(frontmatter.hero.image);
  if (frontmatter.avatar) images.add(frontmatter.avatar);
  if (frontmatter.cover) images.add(frontmatter.cover);
  if (frontmatter.image) images.add(frontmatter.image);
  
  // Extract from sections
  if (frontmatter.sections) {
    frontmatter.sections.forEach(section => {
      if (section.data) {
        if (section.data.avatar) images.add(section.data.avatar);
        if (section.data.logo) images.add(section.data.logo);
        if (section.data.image) images.add(section.data.image);
      }
    });
  }
  
  return Array.from(images);
}

// Generate Decap CMS field configuration
function generateDecapFields(contentType, sampleData) {
  switch (contentType) {
    case 'about_en':
    case 'about_ru':
      return [
        { name: 'title', label: 'Title', widget: 'string' },
        { name: 'locale', label: 'Locale', widget: 'hidden', default: contentType === 'about_en' ? 'en' : 'ru' },
        { name: 'route', label: 'Route', widget: 'hidden', default: contentType === 'about_en' ? '/en/about' : '/ru/about' },
        { name: 'cv_pdf', label: 'CV PDF URL', widget: 'string', required: false },
        {
          name: 'sections',
          label: 'Sections',
          widget: 'list',
          fields: [
            { name: 'type', label: 'Section Type', widget: 'select', options: ['hero', 'skills', 'experience', 'education', 'favorites'] },
            { name: 'data', label: 'Section Data', widget: 'object', fields: [
              { name: 'title', label: 'Title', widget: 'string', required: false },
              { name: 'name', label: 'Name', widget: 'string', required: false },
              { name: 'role', label: 'Role', widget: 'string', required: false },
              { name: 'avatar', label: 'Avatar Image', widget: 'image', required: false },
              { name: 'bio', label: 'Bio', widget: 'markdown', required: false },
              { name: 'location', label: 'Location', widget: 'string', required: false },
              { name: 'links', label: 'Links', widget: 'list', fields: [
                { name: 'label', label: 'Label', widget: 'string' },
                { name: 'url', label: 'URL', widget: 'string' },
                { name: 'icon', label: 'Icon', widget: 'string' }
              ], required: false },
              { name: 'contact', label: 'Contact', widget: 'object', fields: [
                { name: 'email', label: 'Email', widget: 'string' },
                { name: 'phone', label: 'Phone', widget: 'string' }
              ], required: false },
              { name: 'tags', label: 'Tags', widget: 'list', field: { label: 'Tag', name: 'tag', widget: 'string' }, required: false },
              { name: 'groups', label: 'Groups', widget: 'list', fields: [
                { name: 'title', label: 'Group Title', widget: 'string' },
                { name: 'items', label: 'Items', widget: 'list', fields: [
                  { name: 'name', label: 'Name', widget: 'string' },
                  { name: 'icon', label: 'Icon', widget: 'string', required: false },
                  { name: 'level', label: 'Level', widget: 'number', required: false }
                ] }
              ], required: false },
              { name: 'items', label: 'Items', widget: 'list', fields: [
                { name: 'company', label: 'Company', widget: 'string', required: false },
                { name: 'location', label: 'Location', widget: 'string', required: false },
                { name: 'url', label: 'URL', widget: 'string', required: false },
                { name: 'logo', label: 'Logo', widget: 'image', required: false },
                { name: 'roles', label: 'Roles', widget: 'list', fields: [
                  { name: 'title', label: 'Title', widget: 'string' },
                  { name: 'period', label: 'Period', widget: 'string' },
                  { name: 'bullets', label: 'Bullets', widget: 'list', field: { label: 'Bullet', name: 'bullet', widget: 'text' } }
                ] }
              ], required: false }
            ] }
          ]
        }
      ];
      
    case 'blog':
      return [
        { name: 'title', label: 'Title', widget: 'string' },
        { name: 'locale', label: 'Locale', widget: 'select', options: ['en', 'ru'], default: 'en' },
        { name: 'route', label: 'Route', widget: 'string', required: false },
        { name: 'date', label: 'Date', widget: 'datetime' },
        { name: 'description', label: 'Description', widget: 'text', required: false },
        { name: 'tags', label: 'Tags', widget: 'list', field: { label: 'Tag', name: 'tag', widget: 'string' }, required: false },
        { name: 'draft', label: 'Draft', widget: 'boolean', default: false },
        { name: 'coverImage', label: 'Cover Image', widget: 'image', required: false },
        { name: 'body', label: 'Body', widget: 'markdown' }
      ];
      
    default:
      return [
        { name: 'title', label: 'Title', widget: 'string' },
        { name: 'body', label: 'Body', widget: 'markdown' }
      ];
  }
}

// Main execution
async function main() {
  try {
    log('info', 'Starting CMS inventory scan...');
    
    const rootPath = path.resolve(argv.root);
    log('debug', 'Scanning root path', { rootPath });
    
    // Find files
    const files = await fastGlob(argv.globs, {
      cwd: rootPath,
      dot: false,
      ignore: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.astro/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/coverage/**'
      ]
    });
    
    log('debug', 'Found files', { count: files.length, files: files.slice(0, 10) });
    
    const limitedFiles = argv.limit ? files.slice(0, argv.limit) : files;
    const inventory = [];
    const errors = [];
    const collections = new Map();
    const snapshots = {};
    
    // Process each file
    for (const file of limitedFiles) {
      try {
        const filePath = path.join(rootPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const { data: frontmatter, content: body } = matter(content);
        
        const normalized = normalizeFrontmatter(frontmatter, file);
        const contentType = detectContentType(normalized, file);
        const images = extractImages(body, normalized);
        
        const item = {
          path: file,
          title: normalized.title,
          locale: normalized.locale,
          route: normalized.route,
          kind: contentType,
          hero: normalized.hero,
          sections: normalized.sections,
          images,
          tags: normalized.tags || [],
          date: normalized.date || normalized.publishedAt,
          ...normalized
        };
        
        inventory.push(item);
        
        // Validate and collect for collections
        if (contentType === 'about_en' || contentType === 'about_ru') {
          try {
            AboutPageSchema.parse(normalized);
            collections.set(contentType, item);
            snapshots[contentType] = {
              title: normalized.title,
              locale: normalized.locale,
              route: normalized.route,
              hero: normalized.hero,
              sections: normalized.sections
            };
          } catch (error) {
            errors.push({ file, error: error.message, type: 'about_validation' });
          }
        } else if (contentType === 'blog') {
          try {
            BlogPostSchema.parse(normalized);
            if (!collections.has('blog')) {
              collections.set('blog', []);
            }
            collections.get('blog').push(item);
          } catch (error) {
            errors.push({ file, error: error.message, type: 'blog_validation' });
          }
        }
        
        log('debug', 'Processed file', { file, contentType, normalized: { title: normalized.title, locale: normalized.locale } });
        
      } catch (error) {
        errors.push({ file, error: error.message, type: 'processing' });
        log('debug', 'Error processing file', { file, error: error.message });
      }
    }
    
    // Generate Decap CMS configuration
    const proposedDecap = {
      collections: []
    };
    
    // About collections
    if ((argv.only === 'all' || argv.only === 'about') && collections.has('about_en')) {
      proposedDecap.collections.push({
        name: 'about_en',
        label: 'About Page (EN)',
        type: 'files',
        files: [{
          label: 'About Page EN',
          name: 'about_en',
          file: 'apps/website/src/cms-content/about_en.json',
          fields: generateDecapFields('about_en', collections.get('about_en'))
        }]
      });
    }
    
    if ((argv.only === 'all' || argv.only === 'about') && collections.has('about_ru')) {
      proposedDecap.collections.push({
        name: 'about_ru',
        label: 'About Page (RU)',
        type: 'files',
        files: [{
          label: 'About Page RU',
          name: 'about_ru',
          file: 'apps/website/src/cms-content/about_ru.json',
          fields: generateDecapFields('about_ru', collections.get('about_ru'))
        }]
      });
    }
    
    // Blog collection
    if ((argv.only === 'all' || argv.only === 'blog') && collections.has('blog')) {
      proposedDecap.collections.push({
        name: 'blog',
        label: 'Blog Posts',
        type: 'folder',
        folder: 'apps/website/src/cms-content/blog',
        extension: 'json',
        fields: generateDecapFields('blog', collections.get('blog')[0])
      });
    }
    
    // Generate YAML snippet
    const yamlSnippet = YAML.stringify({ collections: proposedDecap.collections }, { indent: 2 });
    proposedDecap.configSnippetYaml = `# BEGIN: auto-cms-ro\n${yamlSnippet}\n# END: auto-cms-ro`;
    
    // Prepare output
    const output = {
      meta: {
        ts: new Date().toISOString(),
        node: nodeVersion,
        root: rootPath,
        scanned: limitedFiles.length,
        total: files.length,
        errors: errors.length
      },
      inventory: inventory.sort((a, b) => {
        const pathCompare = a.path.localeCompare(b.path);
        if (pathCompare !== 0) return pathCompare;
        return (a.locale || '').localeCompare(b.locale || '');
      }),
      proposedDecap,
      snapshotsPreview: snapshots
    };
    
    if (errors.length > 0) {
      output.meta.errors = errors;
    }
    
    // Output results
    if (argv.yaml) {
      console.log(proposedDecap.configSnippetYaml);
      console.log('\n---\n');
    }
    
    const jsonOutput = argv.pretty ? JSON.stringify(output, null, 2) : JSON.stringify(output);
    console.log(jsonOutput);
    
    // Exit codes
    if (errors.length > 0) {
      process.exit(2); // Validation errors
    }
    
    log('info', 'CMS inventory completed successfully', { 
      filesProcessed: limitedFiles.length, 
      collections: proposedDecap.collections.length,
      errors: errors.length 
    });
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    log('debug', 'Fatal error details', error);
    process.exit(1);
  }
}

// Execute
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

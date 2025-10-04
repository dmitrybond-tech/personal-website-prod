#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { stringify } from 'yaml';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default configuration
const DEFAULT_CONFIG = {
  root: 'apps/website',
  globs: ['**/*.md', '**/*.mdx'],
  exclude: ['node_modules/**', '.git/**', '.astro/**', 'dist/**'],
  logLevel: 'info'
};

// Content type detection rules
const CONTENT_RULES = {
  about: {
    en: {
      patterns: [
        /about.*\.en\.md$/i,
        /\/en\/.*about.*\.md$/i,
        /about.*en.*\.md$/i
      ],
      paths: ['content/pages/en']
    },
    ru: {
      patterns: [
        /about.*\.ru\.md$/i,
        /\/ru\/.*about.*\.md$/i,
        /about.*ru.*\.md$/i
      ],
      paths: ['content/pages/ru']
    }
  },
  blog: {
    patterns: [
      /\/blog\//i,
      /\/posts\//i
    ],
    frontmatter: {
      type: 'blog'
    }
  }
};

class DKAPWire {
  constructor(options = {}) {
    this.options = { ...DEFAULT_CONFIG, ...options };
    this.logLevel = this.options.logLevel;
    this.collections = [];
    this.stats = {
      filesScanned: 0,
      aboutEn: 0,
      aboutRu: 0,
      blogFolders: new Set()
    };
  }

  log(level, message, ...args) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] >= levels[this.logLevel]) {
      console.log(`[${level.toUpperCase()}] ${message}`, ...args);
    }
  }

  async scanFiles() {
    this.log('info', `Scanning files in ${this.options.root}...`);
    
    const searchPatterns = this.options.globs.map(pattern => 
      join(this.options.root, pattern).replace(/\\/g, '/')
    );
    
    const excludePatterns = this.options.exclude.map(pattern => 
      join(this.options.root, pattern).replace(/\\/g, '/')
    );

    this.log('debug', `Search patterns: ${JSON.stringify(searchPatterns)}`);
    this.log('debug', `Exclude patterns: ${JSON.stringify(excludePatterns)}`);

    const files = await fg(searchPatterns, {
      ignore: excludePatterns,
      absolute: true
    });

    this.stats.filesScanned = files.length;
    this.log('info', `Found ${files.length} markdown files`);
    this.log('debug', `Files found: ${JSON.stringify(files)}`);

    return files;
  }

  detectContentType(filePath, frontmatter = {}) {
    const relativePath = relative(this.options.root, filePath);
    const fileName = filePath.split('/').pop().toLowerCase();
    
    this.log('debug', `Analyzing: ${relativePath}`);

    // Check for About pages
    if (this.isAboutPage(filePath, fileName)) {
      if (this.isEnglishContent(filePath, fileName)) {
        this.stats.aboutEn++;
        return { type: 'about', locale: 'en', file: filePath };
      } else if (this.isRussianContent(filePath, fileName)) {
        this.stats.aboutRu++;
        return { type: 'about', locale: 'ru', file: filePath };
      }
    }

    // Check for Blog content
    if (this.isBlogContent(filePath, frontmatter)) {
      const blogDir = this.getBlogDirectory(filePath);
      this.stats.blogFolders.add(blogDir);
      return { type: 'blog', directory: blogDir, locale: this.detectLocale(filePath) };
    }

    return null;
  }

  isAboutPage(filePath, fileName) {
    const relativePath = relative(this.options.root, filePath).toLowerCase();
    return relativePath.includes('about') || fileName.includes('about');
  }

  isEnglishContent(filePath, fileName) {
    const relativePath = relative(this.options.root, filePath).toLowerCase();
    return relativePath.includes('/en/') || 
           fileName.includes('.en.') || 
           fileName.includes('en-') ||
           relativePath.includes('english');
  }

  isRussianContent(filePath, fileName) {
    const relativePath = relative(this.options.root, filePath).toLowerCase();
    return relativePath.includes('/ru/') || 
           fileName.includes('.ru.') || 
           fileName.includes('ru-') ||
           relativePath.includes('russian');
  }

  isBlogContent(filePath, frontmatter) {
    const relativePath = relative(this.options.root, filePath).toLowerCase().replace(/\\/g, '/');
    
    // Check path patterns
    for (const pattern of CONTENT_RULES.blog.patterns) {
      if (pattern.test(relativePath)) {
        return true;
      }
    }

    // Check frontmatter
    if (frontmatter.type === 'blog' || frontmatter.layout === 'post') {
      return true;
    }

    return false;
  }

  getBlogDirectory(filePath) {
    const relativePath = relative(this.options.root, filePath).replace(/\\/g, '/');
    const pathParts = relativePath.split('/');
    
    // Find the blog/posts directory
    for (let i = 0; i < pathParts.length; i++) {
      if (pathParts[i].toLowerCase() === 'posts' || pathParts[i].toLowerCase() === 'blog') {
        return join(this.options.root, pathParts.slice(0, i + 1).join('/'));
      }
    }
    
    // Fallback to parent directory
    return dirname(filePath);
  }

  detectLocale(filePath) {
    const relativePath = relative(this.options.root, filePath).toLowerCase().replace(/\\/g, '/');
    if (relativePath.includes('/en/') || relativePath.includes('.en.')) {
      return 'en';
    } else if (relativePath.includes('/ru/') || relativePath.includes('.ru.')) {
      return 'ru';
    }
    return 'en'; // default
  }

  async processFiles(files) {
    const contentMap = new Map();
    
    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');
        const { data: frontmatter } = matter(content);
        
        const contentType = this.detectContentType(file, frontmatter);
        if (contentType) {
          contentMap.set(file, contentType);
        }
      } catch (error) {
        this.log('warn', `Failed to process ${file}: ${error.message}`);
      }
    }

    return contentMap;
  }

  generateCollections(contentMap) {
    const collections = [];

    // Generate About collections
    const aboutEn = Array.from(contentMap.entries())
      .find(([_, content]) => content.type === 'about' && content.locale === 'en');
    
    const aboutRu = Array.from(contentMap.entries())
      .find(([_, content]) => content.type === 'about' && content.locale === 'ru');

    if (aboutEn) {
      collections.push(this.createAboutCollection('en', aboutEn[0]));
    }

    if (aboutRu) {
      collections.push(this.createAboutCollection('ru', aboutRu[0]));
    }

    // Generate Blog collections
    const blogDirs = Array.from(this.stats.blogFolders);
    const blogCollections = new Map();
    
    for (const blogDir of blogDirs) {
      const locale = this.detectLocale(blogDir);
      const relativeDir = relative(this.options.root, blogDir).replace(/\\/g, '/');
      
      // Create unique collection names based on directory structure
      let collectionName = 'blog';
      if (relativeDir.includes('/en/')) {
        collectionName = 'blog_en';
      } else if (relativeDir.includes('/ru/')) {
        collectionName = 'blog_ru';
      } else {
        // Create unique names based on full path structure
        const pathParts = relativeDir.split('/');
        // Include 'src' in the name to distinguish from content/ paths
        const relevantParts = pathParts.filter(part => part && part !== 'content');
        if (relevantParts.length > 1) {
          collectionName = `blog_${relevantParts.join('_')}`;
        } else {
          collectionName = `blog_${relevantParts[0] || 'main'}`;
        }
      }
      
      // Avoid duplicates by using directory as key
      if (!blogCollections.has(blogDir)) {
        blogCollections.set(blogDir, this.createBlogCollection(collectionName, blogDir, locale));
      }
    }
    
    collections.push(...blogCollections.values());

    return collections.sort((a, b) => a.name.localeCompare(b.name));
  }

  createAboutCollection(locale, filePath) {
    const relativePath = relative(this.options.root, filePath).replace(/\\/g, '/');
    const name = `About (${locale.toUpperCase()})`;
    
    return {
      name,
      label: name,
      type: 'files',
      format: 'frontmatter',
      file: relativePath,
      create: false,
      delete: false,
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'string',
          required: true
        },
        {
          name: 'image',
          label: 'Image',
          type: 'image',
          required: false
        },
        {
          name: 'body',
          label: 'Body',
          type: 'markdown',
          required: true
        }
      ]
    };
  }

  createBlogCollection(name, directory, locale) {
    const relativeDir = relative(this.options.root, directory).replace(/\\/g, '/');
    const label = locale === 'ru' ? `Блог (${locale.toUpperCase()})` : `Blog (${locale.toUpperCase()})`;
    
    return {
      name,
      label,
      type: 'folder',
      folder: relativeDir,
      extension: 'md',
      format: 'frontmatter',
      create: false,
      delete: false,
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'string',
          required: true
        },
        {
          name: 'date',
          label: 'Date',
          type: 'datetime',
          required: true
        },
        {
          name: 'tags',
          label: 'Tags',
          type: 'list',
          required: false
        },
        {
          name: 'cover',
          label: 'Cover Image',
          type: 'image',
          required: false
        },
        {
          name: 'body',
          label: 'Body',
          type: 'markdown',
          required: true
        }
      ]
    };
  }

  generateConfig(collections) {
    const config = {
      backend: {
        name: 'git',
        branch: 'main'
      },
      local_backend: true,
      media_folder: 'apps/website/public/uploads',
      public_folder: '/uploads',
      collections
    };

    return config;
  }

  async run() {
    try {
      this.log('info', 'Starting DKAP wire-up process...');
      
      // Load custom rules if available
      await this.loadCustomRules();
      
      // Scan and process files
      const files = await this.scanFiles();
      const contentMap = await this.processFiles(files);
      
      // Generate collections
      const collections = this.generateCollections(contentMap);
      
      // Generate final config
      const config = this.generateConfig(collections);
      
      // Output results
      this.logResults(collections);
      
      if (this.options.apply) {
        await this.writeConfig(config);
      } else {
        this.outputConfig(config);
      }
      
      return 0;
    } catch (error) {
      this.log('error', `Fatal error: ${error.message}`);
      if (this.logLevel === 'debug') {
        console.error(error.stack);
      }
      return 1;
    }
  }

  async loadCustomRules() {
    const rulesPath = join(this.options.root, 'scripts', 'dkap-wire.rules.json');
    if (existsSync(rulesPath)) {
      try {
        const customRules = JSON.parse(readFileSync(rulesPath, 'utf-8'));
        
        // Convert string patterns to RegExp objects
        if (customRules.about) {
          if (customRules.about.en && customRules.about.en.patterns) {
            customRules.about.en.patterns = customRules.about.en.patterns.map(p => 
              typeof p === 'string' ? new RegExp(p.slice(1, -2), p.slice(-1)) : p
            );
          }
          if (customRules.about.ru && customRules.about.ru.patterns) {
            customRules.about.ru.patterns = customRules.about.ru.patterns.map(p => 
              typeof p === 'string' ? new RegExp(p.slice(1, -2), p.slice(-1)) : p
            );
          }
        }
        
        if (customRules.blog && customRules.blog.patterns) {
          customRules.blog.patterns = customRules.blog.patterns.map(p => 
            typeof p === 'string' ? new RegExp(p.slice(1, -2), p.slice(-1)) : p
          );
        }
        
        Object.assign(CONTENT_RULES, customRules);
        this.log('info', 'Loaded custom rules from dkap-wire.rules.json');
      } catch (error) {
        this.log('warn', `Failed to load custom rules: ${error.message}`);
      }
    }
  }

  logResults(collections) {
    this.log('info', '\n=== SCAN RESULTS ===');
    this.log('info', `Files scanned: ${this.stats.filesScanned}`);
    this.log('info', `About (EN) pages: ${this.stats.aboutEn}`);
    this.log('info', `About (RU) pages: ${this.stats.aboutRu}`);
    this.log('info', `Blog directories: ${this.stats.blogFolders.size}`);
    this.log('info', `Collections generated: ${collections.length}`);
    
    if (collections.length > 0) {
      this.log('info', '\nCollections:');
      collections.forEach(collection => {
        this.log('info', `  - ${collection.name} (${collection.type})`);
      });
    }
  }

  outputConfig(config) {
    const yamlString = stringify(config, {
      indent: 2,
      lineWidth: -1
    });
    
    console.log('\n=== GENERATED CONFIG ===');
    console.log(yamlString);
  }

  async writeConfig(config) {
    const configPath = join(this.options.root, 'admin', 'config.generated.yml');
    const yamlString = stringify(config, {
      indent: 2,
      lineWidth: -1
    });
    
    writeFileSync(configPath, yamlString, 'utf-8');
    this.log('info', `\nConfig written to: ${configPath}`);
    
    this.printInstructions();
  }

  printInstructions() {
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Start the Decap CMS proxy server:');
    console.log('   npx decap-cms-proxy-server --port 8081');
    console.log('\n2. Open the admin interface:');
    console.log('   http://localhost:4321/website-admin/?config=/admin/config.generated.yml');
    console.log('\n3. The admin will show your existing content collections');
    console.log('   - Edit existing About pages and blog posts');
    console.log('   - Changes will be written directly to your markdown files');
    console.log('   - No Git integration required (local backend mode)');
  }
}

// CLI setup
const argv = yargs(hideBin(process.argv))
  .option('root', {
    type: 'string',
    default: 'apps/website',
    description: 'Root directory to scan'
  })
  .option('globs', {
    type: 'array',
    default: ['**/*.md', '**/*.mdx'],
    description: 'File patterns to include'
  })
  .option('apply', {
    type: 'boolean',
    default: false,
    description: 'Write config.generated.yml file'
  })
  .option('pretty', {
    type: 'boolean',
    default: false,
    description: 'Pretty-print YAML output'
  })
  .option('logLevel', {
    type: 'string',
    choices: ['debug', 'info', 'warn', 'error'],
    default: 'info',
    description: 'Logging level'
  })
  .help()
  .alias('h', 'help')
  .version(false)
  .parseSync();

// Main execution
const dkap = new DKAPWire(argv);
process.exit(await dkap.run());

#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
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
  contentDir: 'src/content/aboutPage',
  adminDir: 'admin',
  logLevel: 'info'
};

class DecapMigrate {
  constructor(options = {}) {
    this.options = { ...DEFAULT_CONFIG, ...options };
    this.logLevel = this.options.logLevel;
    this.stats = {
      filesScanned: 0,
      aboutExpandedFiles: 0,
      collectionsGenerated: 0
    };
  }

  log(level, message, ...args) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] >= levels[this.logLevel]) {
      console.log(`[${level.toUpperCase()}] ${message}`, ...args);
    }
  }

  async scanAboutExpandedFiles() {
    this.log('info', `Scanning for about-expanded.md files in ${this.options.root}...`);
    
    // Use relative path from the script's working directory
    const searchPattern = join(this.options.contentDir, '**/about-expanded.md').replace(/\\/g, '/');
    
    this.log('debug', `Search pattern: ${searchPattern}`);

    const files = await fg([searchPattern], {
      absolute: true
    });

    this.stats.filesScanned = files.length;
    this.log('info', `Found ${files.length} about-expanded.md files`);
    
    if (files.length === 0) {
      this.log('warn', 'No about-expanded.md files found. Creating sample structure...');
      if (this.options.apply) {
        await this.createSampleAboutExpandedFiles();
        return await fg([searchPattern], { absolute: true });
      }
    }

    return files;
  }

  async createSampleAboutExpandedFiles() {
    this.log('info', 'Creating sample about-expanded.md files...');
    
    const sampleContent = `---
title: About
slug: en/about
sections:
  - type: main
    data:
      title: Profile
      slug: profile
      icon: fa6-solid:user
      visible: true
      fullName: Mark Freeman
      role: Senior React Developer
      image: /devscard/my-image.jpeg
      description: |
        Lorem ipsum dolor sit amet, consectetur **adipiscing elit**. In sodales ac dui at *vestibulum*.
      details:
        - label: Phone
          value: 605 475 6961
          url: tel:605 475 6961
        - label: Email
          value: mark.freeman.dev@gmail.com
          url: mailto:mark.freeman.dev@gmail.com
        - label: From
          value: Warsaw, Poland
      tags:
        - name: Open for freelance
        - name: Available for mentoring
      action:
        label: Download CV
        url: /devscard/cv.pdf
        downloadedFileName: CV-Mark_Freeman.pdf
      links:
        - label: GitHub
          url: "#"
          icon: fa6-brands:github
          color: "#181717"
        - label: LinkedIn
          url: "#"
          icon: fa6-brands:linkedin
          color: "#0A66C2"

  - type: skills
    data:
      title: Skills
      slug: skills
      icon: fa6-solid:bars-progress
      visible: true
      skillSets:
        - title: I already know
          skills:
            - name: React
              icon: fa6-brands:react
              level: 5
            - name: TypeScript
              icon: fa6-brands:typescript
              level: 4

  - type: experience
    data:
      title: Experience
      slug: experience
      icon: fa6-solid:briefcase
      visible: true
      items:
        - company: CloudBlue
          location: 'Enschede, the Netherlands'
          logo: /logos/cloudblue.svg
          website: https://cloudblue.com
          roles:
            - title: Delivery Manager
              period: Mar 2023 – Apr 2025
              description: Led partner enablement and post-launch support across a cloud-based commerce platform.
              bullets:
                - Led partner enablement and post-launch support across a cloud-based commerce platform.
                - Managed delivery of integration projects, advised on product configuration and SaaS monetization strategies.
              technologies:
                - React
                - TypeScript
                - Node.js
                - AWS

  - type: favorites
    data:
      title: Favorites
      slug: favorites
      icon: fa6-solid:star
      visible: true
      style:
        variant: tile
        cols:
          base: 2
          sm: 3
          lg: 6
      groups:
        - title: Books I read
          type: books
          style:
            limit: 5
          items:
            - title: The Pragmatic Programmer
              author: Andy Hunt, Dave Thomas
              url: https://www.goodreads.com/book/show/4099.The_Pragmatic_Programmer
              image: /devscard/favorites/books/book-1.jpeg
        - title: People I learn from
          type: people
          style:
            limit: 5
          items:
            - name: Kent C. Dodds
              url: https://kentcdodds.com/
              image: /devscard/favorites/people/person-1.jpg
---`;

    // Create directories and files for both locales
    const locales = ['en', 'ru'];
    for (const locale of locales) {
      const dirPath = join(this.options.root, this.options.contentDir, locale);
      const filePath = join(dirPath, 'about-expanded.md');
      
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
        this.log('info', `Created directory: ${dirPath}`);
      }
      
      if (!existsSync(filePath)) {
        writeFileSync(filePath, sampleContent, 'utf-8');
        this.log('info', `Created sample file: ${filePath}`);
      }
    }
  }

  async processAboutExpandedFiles(files) {
    const contentMap = new Map();
    
    for (const file of files) {
      try {
        this.log('debug', `Processing file: ${file}`);
        const content = readFileSync(file, 'utf-8');
        const { data: frontmatter } = matter(content);
        
        // Extract locale from file path
        const locale = this.extractLocaleFromPath(file);
        this.log('debug', `Extracted locale: ${locale} from ${file}`);
        if (locale) {
          contentMap.set(locale, { file, frontmatter });
          this.stats.aboutExpandedFiles++;
          this.log('debug', `Added to content map: ${locale}`);
        } else {
          this.log('warn', `Could not extract locale from ${file}`);
        }
      } catch (error) {
        this.log('warn', `Failed to process ${file}: ${error.message}`);
      }
    }

    return contentMap;
  }

  extractLocaleFromPath(filePath) {
    // Convert to forward slashes for consistency
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Look for locale in path structure
    if (normalizedPath.includes('/en/about-expanded.md')) {
      return 'en';
    } else if (normalizedPath.includes('/ru/about-expanded.md')) {
      return 'ru';
    }
    
    return null;
  }

  generateAboutExpandedCollections(contentMap) {
    const collections = [];

    for (const [locale, { file, frontmatter }] of contentMap) {
      // Generate relative path for Decap CMS
      const relativePath = file.replace(join(process.cwd()), '').replace(/\\/g, '/').replace(/^\//, '');
      const name = `About Expanded (${locale.toUpperCase()})`;
      
      const collection = {
        name: name.replace(/\s+/g, '_').toLowerCase(),
        label: name,
        type: 'files',
        format: 'frontmatter',
        file: relativePath,
        create: false,
        delete: false,
        fields: this.generateAboutExpandedFields(frontmatter)
      };

      collections.push(collection);
      this.stats.collectionsGenerated++;
    }

    return collections;
  }

  generateAboutExpandedFields(frontmatter) {
    const fields = [
      {
        name: 'title',
        label: 'Page Title',
        type: 'string',
        required: true
      },
      {
        name: 'slug',
        label: 'URL Slug',
        type: 'string',
        required: true
      },
      {
        name: 'sections',
        label: 'Page Sections',
        type: 'list',
        required: true,
        fields: [
          {
            name: 'type',
            label: 'Section Type',
            type: 'select',
            options: ['main', 'skills', 'experience', 'favorites', 'education', 'portfolio', 'testimonials'],
            required: true
          },
          {
            name: 'data',
            label: 'Section Data',
            type: 'object',
            required: true,
            fields: [
              // Common fields for all sections
              {
                name: 'title',
                label: 'Section Title',
                type: 'string',
                required: true
              },
              {
                name: 'slug',
                label: 'Section Slug',
                type: 'string',
                required: false
              },
              {
                name: 'icon',
                label: 'Section Icon',
                type: 'string',
                required: false
              },
              {
                name: 'visible',
                label: 'Visible',
                type: 'boolean',
                required: false
              },
              
              // Main section fields
              {
                name: 'fullName',
                label: 'Full Name',
                type: 'string',
                required: false
              },
              {
                name: 'role',
                label: 'Role/Position',
                type: 'string',
                required: false
              },
              {
                name: 'image',
                label: 'Profile Image',
                type: 'image',
                required: false
              },
              {
                name: 'description',
                label: 'Description',
                type: 'markdown',
                required: false
              },
              {
                name: 'details',
                label: 'Profile Details',
                type: 'list',
                required: false,
                fields: [
                  {
                    name: 'label',
                    label: 'Detail Label',
                    type: 'string',
                    required: true
                  },
                  {
                    name: 'value',
                    label: 'Detail Value',
                    type: 'string',
                    required: true
                  },
                  {
                    name: 'url',
                    label: 'Detail URL (optional)',
                    type: 'string',
                    required: false
                  }
                ]
              },
              {
                name: 'tags',
                label: 'Tags',
                type: 'list',
                required: false,
                fields: [
                  {
                    name: 'name',
                    label: 'Tag Name',
                    type: 'string',
                    required: true
                  }
                ]
              },
              {
                name: 'action',
                label: 'Download Action',
                type: 'object',
                required: false,
                fields: [
                  {
                    name: 'label',
                    label: 'Button Label',
                    type: 'string',
                    required: true
                  },
                  {
                    name: 'url',
                    label: 'Download URL',
                    type: 'string',
                    required: true
                  },
                  {
                    name: 'downloadedFileName',
                    label: 'Downloaded File Name',
                    type: 'string',
                    required: false
                  }
                ]
              },
              {
                name: 'links',
                label: 'Social Links',
                type: 'list',
                required: false,
                fields: [
                  {
                    name: 'label',
                    label: 'Link Label',
                    type: 'string',
                    required: true
                  },
                  {
                    name: 'url',
                    label: 'Link URL',
                    type: 'string',
                    required: true
                  },
                  {
                    name: 'icon',
                    label: 'Link Icon',
                    type: 'string',
                    required: false
                  },
                  {
                    name: 'color',
                    label: 'Link Color',
                    type: 'string',
                    required: false
                  }
                ]
              },

              // Skills section fields
              {
                name: 'skillSets',
                label: 'Skill Categories',
                type: 'list',
                required: false,
                fields: [
                  {
                    name: 'title',
                    label: 'Category Title',
                    type: 'string',
                    required: true
                  },
                  {
                    name: 'skills',
                    label: 'Skills in Category',
                    type: 'list',
                    required: false,
                    fields: [
                      {
                        name: 'name',
                        label: 'Skill Name',
                        type: 'string',
                        required: true
                      },
                      {
                        name: 'level',
                        label: 'Skill Level (1-5)',
                        type: 'number',
                        required: false
                      },
                      {
                        name: 'icon',
                        label: 'Skill Icon',
                        type: 'string',
                        required: false
                      },
                      {
                        name: 'description',
                        label: 'Skill Description',
                        type: 'text',
                        required: false
                      }
                    ]
                  }
                ]
              },

              // Experience section fields
              {
                name: 'items',
                label: 'Experience Items',
                type: 'list',
                required: false,
                fields: [
                  {
                    name: 'company',
                    label: 'Company Name',
                    type: 'string',
                    required: true
                  },
                  {
                    name: 'location',
                    label: 'Location',
                    type: 'string',
                    required: false
                  },
                  {
                    name: 'logo',
                    label: 'Company Logo',
                    type: 'image',
                    required: false
                  },
                  {
                    name: 'website',
                    label: 'Company Website',
                    type: 'string',
                    required: false
                  },
                  {
                    name: 'roles',
                    label: 'Job Roles',
                    type: 'list',
                    required: true,
                    fields: [
                      {
                        name: 'title',
                        label: 'Role Title',
                        type: 'string',
                        required: true
                      },
                      {
                        name: 'period',
                        label: 'Employment Period',
                        type: 'string',
                        required: true
                      },
                      {
                        name: 'description',
                        label: 'Role Description',
                        type: 'markdown',
                        required: false
                      },
                      {
                        name: 'bullets',
                        label: 'Achievements',
                        type: 'list',
                        required: false,
                        field: {
                          name: 'bullet',
                          label: 'Achievement',
                          type: 'text'
                        }
                      },
                      {
                        name: 'technologies',
                        label: 'Technologies Used',
                        type: 'list',
                        required: false,
                        field: {
                          name: 'tech',
                          label: 'Technology',
                          type: 'string'
                        }
                      },
                      {
                        name: 'links',
                        label: 'Project Links',
                        type: 'list',
                        required: false,
                        fields: [
                          {
                            name: 'label',
                            label: 'Link Label',
                            type: 'string',
                            required: true
                          },
                          {
                            name: 'url',
                            label: 'Link URL',
                            type: 'string',
                            required: true
                          }
                        ]
                      }
                    ]
                  }
                ]
              },

              // Favorites section fields
              {
                name: 'style',
                label: 'Display Style',
                type: 'object',
                required: false,
                fields: [
                  {
                    name: 'variant',
                    label: 'Layout Variant',
                    type: 'select',
                    options: ['tile', 'list', 'grid', 'card'],
                    required: false
                  },
                  {
                    name: 'cols',
                    label: 'Column Settings',
                    type: 'object',
                    required: false,
                    fields: [
                      {
                        name: 'base',
                        label: 'Base Columns',
                        type: 'number',
                        required: false
                      },
                      {
                        name: 'sm',
                        label: 'Small Screen Columns',
                        type: 'number',
                        required: false
                      },
                      {
                        name: 'lg',
                        label: 'Large Screen Columns',
                        type: 'number',
                        required: false
                      }
                    ]
                  }
                ]
              },
              {
                name: 'groups',
                label: 'Favorite Groups',
                type: 'list',
                required: false,
                fields: [
                  {
                    name: 'title',
                    label: 'Group Title',
                    type: 'string',
                    required: true
                  },
                  {
                    name: 'type',
                    label: 'Group Type',
                    type: 'select',
                    options: ['books', 'people', 'videos', 'medias', 'hobbies', 'movies'],
                    required: true
                  },
                  {
                    name: 'style',
                    label: 'Group Style',
                    type: 'object',
                    required: false,
                    fields: [
                      {
                        name: 'limit',
                        label: 'Items Limit',
                        type: 'number',
                        required: false
                      }
                    ]
                  },
                  {
                    name: 'items',
                    label: 'Group Items',
                    type: 'list',
                    required: false,
                    fields: [
                      {
                        name: 'title',
                        label: 'Item Title',
                        type: 'string',
                        required: true
                      },
                      {
                        name: 'name',
                        label: 'Item Name (for people)',
                        type: 'string',
                        required: false
                      },
                      {
                        name: 'author',
                        label: 'Author (for books)',
                        type: 'string',
                        required: false
                      },
                      {
                        name: 'type',
                        label: 'Type (for media)',
                        type: 'string',
                        required: false
                      },
                      {
                        name: 'description',
                        label: 'Item Description',
                        type: 'text',
                        required: false
                      },
                      {
                        name: 'url',
                        label: 'Item URL',
                        type: 'string',
                        required: false
                      },
                      {
                        name: 'image',
                        label: 'Item Image/Thumbnail',
                        type: 'image',
                        required: false
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ];

    return fields;
  }

  generateConfig(collections) {
    const config = {
      backend: {
        name: 'git',
        branch: 'main'
      },
      local_backend: true,
      media_folder: join(this.options.root, 'public/uploads'),
      public_folder: '/uploads',
      collections
    };

    return config;
  }

  async loadExistingConfig() {
    const configPath = join(this.options.adminDir, 'config.generated.yml');
    
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, 'utf-8');
        // Parse YAML content (simplified - in production use proper YAML parser)
        this.log('info', 'Found existing config.generated.yml, will merge collections');
        return true;
      } catch (error) {
        this.log('warn', `Failed to read existing config: ${error.message}`);
      }
    }
    
    return false;
  }

  async run() {
    try {
      this.log('info', 'Starting Decap CMS migration for About Expanded...');
      
      // Scan for about-expanded.md files
      const files = await this.scanAboutExpandedFiles();
      
      if (files.length === 0) {
        this.log('error', 'No about-expanded.md files found and sample creation failed');
        return 1;
      }
      
      // Process files
      this.log('debug', `Processing ${files.length} files...`);
      const contentMap = await this.processAboutExpandedFiles(files);
      this.log('debug', `Content map size: ${contentMap.size}`);
      
      // Generate collections
      const collections = this.generateAboutExpandedCollections(contentMap);
      
      // Check for existing config
      const hasExistingConfig = await this.loadExistingConfig();
      
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

  logResults(collections) {
    this.log('info', '\n=== MIGRATION RESULTS ===');
    this.log('info', `Files scanned: ${this.stats.filesScanned}`);
    this.log('info', `About Expanded files: ${this.stats.aboutExpandedFiles}`);
    this.log('info', `Collections generated: ${this.stats.collectionsGenerated}`);
    
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
    const configDir = join(this.options.adminDir);
    const configPath = join(configDir, 'config.generated.yml');
    
    // Ensure admin directory exists
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
      this.log('info', `Created admin directory: ${configDir}`);
    }
    
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
    console.log('1. Install required dependencies:');
    console.log('   pnpm add -D fast-glob@3.3.2 gray-matter@4.0.3 yaml@2.5.0 toml@3.0.0 yargs@17.7.2 zod@3.23.8');
    console.log('\n2. Start the Decap CMS proxy server:');
    console.log('   npx decap-cms-proxy-server --port 8081');
    console.log('\n3. Open the admin interface:');
    console.log('   http://localhost:4321/website-admin/?config=/admin/config.generated.yml');
    console.log('\n4. The admin will show your About Expanded collections:');
    console.log('   - Edit existing About pages with full section support');
    console.log('   - Manage experience items, skills, favorites, etc.');
    console.log('   - Edit company logos, links, descriptions');
    console.log('   - Changes will be written directly to your markdown files');
    console.log('   - No Git integration required (local backend mode)');
    console.log('\n5. Update your About page to use the new data source:');
    console.log('   - Import loadAboutExpanded from devscard/lib/loadAboutExpanded');
    console.log('   - Replace current data loading with loadAboutExpanded(locale)');
  }
}

// CLI setup
const argv = yargs(hideBin(process.argv))
  .option('root', {
    type: 'string',
    default: 'apps/website',
    description: 'Root directory of the website'
  })
  .option('contentDir', {
    type: 'string',
    default: 'src/content/aboutPage',
    description: 'Content directory relative to root'
  })
  .option('adminDir', {
    type: 'string',
    default: 'admin',
    description: 'Admin directory relative to root'
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
const migrator = new DecapMigrate(argv);
process.exit(await migrator.run());

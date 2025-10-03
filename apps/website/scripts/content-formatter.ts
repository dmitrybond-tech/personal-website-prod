#!/usr/bin/env tsx

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import yaml from 'yaml';
import { z } from 'zod';

// Get the project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// CLI argument parsing
interface CliArgs {
  dryRun: boolean;
  write: boolean;
  format: 'md' | 'json' | 'infer';
  langs: string[];
  overwrite: boolean;
  sortItems: boolean;
  strict: boolean;
  backup: boolean;
  pretty: boolean;
  debug: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    dryRun: false,
    write: false,
    format: 'infer',
    langs: ['en', 'ru'],
    overwrite: false,
    sortItems: false,
    strict: false,
    backup: false,
    pretty: false,
    debug: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run') result.dryRun = true;
    if (arg === '--write') result.write = true;
    if (arg === '--overwrite') result.overwrite = true;
    if (arg === '--sort-items') result.sortItems = true;
    if (arg === '--strict') result.strict = true;
    if (arg === '--backup') result.backup = true;
    if (arg === '--pretty') result.pretty = true;
    if (arg === '--debug') result.debug = true;
    if (arg.startsWith('--format=')) result.format = arg.split('=')[1] as 'md' | 'json' | 'infer';
    if (arg.startsWith('--lang=')) result.langs = arg.split('=')[1].split(',');
  }

  return result;
}

// Field inventory tracking
interface FieldInventory {
  [sectionType: string]: {
    [fieldPath: string]: {
      count: number;
      examples: any[];
      types: Set<string>;
    };
  };
}

interface MappingSummary {
  [sectionType: string]: {
    explicit: string[];
    passthrough: string[];
    extras: string[];
  };
}

interface WriteDiff {
  [filePath: string]: {
    action: 'created' | 'modified' | 'skipped';
    sectionsCount: number;
    errors?: string[];
    warnings?: string[];
  };
}

// DevsCard data discovery - extract data from existing about.md files and enhance them
async function discoverDevscardData(locale: 'en' | 'ru'): Promise<any> {
  const aboutPagePath = join(projectRoot, 'src', 'content', 'aboutPage', locale, 'about.md');
  
  try {
    if (!existsSync(aboutPagePath)) {
      console.log(`[INFO] No existing about.md file found for ${locale}, will create new one`);
      return createDefaultDevscardData(locale);
    }

    // Read existing about.md file
    const content = readFileSync(aboutPagePath, 'utf-8');
    const { data: frontmatter } = matter(content);
    
    console.log(`[DEBUG] Found existing about.md for ${locale} with ${frontmatter.sections?.length || 0} sections`);
    
    // Convert existing about.md structure to DevsCard-like format for enhancement
    const sections: any = {};
    
    if (frontmatter.sections) {
      frontmatter.sections.forEach((section: any) => {
        const type = normalizeSectionType(section.type);
        
        switch (type) {
          case 'skills':
            sections.skills = {
              config: {
                title: section.data?.title || 'Skills',
                slug: 'skills',
                icon: 'fa6-solid:bars-progress',
                visible: true
              },
              skillSets: section.data?.groups?.map((group: any) => ({
                title: group.title,
                skills: group.items?.map((item: any) => ({
                  name: item.name,
                  icon: item.icon,
                  url: item.url,
                  level: item.level,
                  description: item.description,
                  ...item // Include any additional fields
                })) || []
              })) || []
            };
            break;
            
          case 'experience':
            sections.experience = {
              config: {
                title: section.data?.title || 'Experience',
                slug: 'experience',
                icon: 'fa6-solid:suitcase',
                visible: true
              },
              jobs: section.data?.items?.map((item: any) => ({
                role: item.name,
                company: item.company,
                description: item.description,
                dates: item.dates,
                image: item.image,
                ...item
              })) || []
            };
            break;
            
          case 'projects':
            sections.portfolio = {
              config: {
                title: section.data?.title || 'Projects',
                slug: 'projects',
                icon: 'fa6-solid:rocket',
                visible: true
              },
              projects: section.data?.items?.map((item: any) => ({
                name: item.name,
                description: item.description,
                image: item.image,
                dates: item.dates,
                ...item
              })) || []
            };
            break;
            
          case 'education':
            sections.education = {
              config: {
                title: section.data?.title || 'Education',
                slug: 'education',
                icon: 'fa6-solid:graduation-cap',
                visible: true
              },
              diplomas: section.data?.items?.map((item: any) => ({
                title: item.name,
                institution: item.institution,
                description: item.description,
                dates: item.dates,
                ...item
              })) || []
            };
            break;
            
          case 'testimonials':
            sections.testimonials = {
              config: {
                title: section.data?.title || 'Testimonials',
                slug: 'testimonials',
                icon: 'fa6-solid:comment',
                visible: true
              },
              testimonials: section.data?.items?.map((item: any) => ({
                author: item.name,
                content: item.content,
                relation: item.relation,
                image: item.image,
                ...item
              })) || []
            };
            break;
            
          case 'favorites':
            sections.favorites = {
              config: {
                title: section.data?.title || 'Favorites',
                slug: 'favorites',
                icon: 'fa6-solid:star',
                visible: true
              },
              books: {
                title: 'Books',
                data: section.data?.items?.filter((item: any) => item.type === 'book') || []
              },
              people: {
                title: 'People',
                data: section.data?.items?.filter((item: any) => item.type === 'person') || []
              },
              videos: {
                title: 'Videos',
                data: section.data?.items?.filter((item: any) => item.type === 'video') || []
              },
              medias: {
                title: 'Media',
                data: section.data?.items?.filter((item: any) => item.type === 'media') || []
              }
            };
            break;
            
          case 'hero':
            sections.main = {
              config: {
                title: section.data?.title || 'Profile',
                slug: 'profile',
                icon: 'fa6-solid:user',
                visible: true
              },
              fullName: section.data?.fullName,
              role: section.data?.role,
              description: section.data?.description,
              image: section.data?.image,
              details: section.data?.details,
              links: section.data?.links,
              tags: section.data?.tags,
              action: section.data?.action,
              ...section.data
            };
            break;
            
          default:
            // Generic section
            sections[type] = {
              config: {
                title: section.data?.title || type.charAt(0).toUpperCase() + type.slice(1),
                slug: type,
                icon: 'fa6-solid:circle',
                visible: true
              },
              ...section.data
            };
            break;
        }
      });
    }
    
    return sections;
  } catch (error) {
    console.warn(`[WARN] Could not parse existing about.md for ${locale}: ${error}`);
    return createDefaultDevscardData(locale);
  }
}

// Create default DevsCard data structure
function createDefaultDevscardData(locale: 'en' | 'ru'): any {
  return {
    main: {
      config: {
        title: 'Profile',
        slug: 'profile',
        icon: 'fa6-solid:user',
        visible: true
      },
      fullName: locale === 'en' ? 'Your Name' : 'Ваше Имя',
      role: locale === 'en' ? 'Your Role' : 'Ваша Роль',
      description: locale === 'en' ? 'Your description here...' : 'Ваше описание здесь...',
      image: '/assets/profile.jpg',
      details: [],
      links: [],
      tags: [],
      action: null
    },
    skills: {
      config: {
        title: locale === 'en' ? 'Skills' : 'Навыки',
        slug: 'skills',
        icon: 'fa6-solid:bars-progress',
        visible: true
      },
      skillSets: []
    },
    experience: {
      config: {
        title: locale === 'en' ? 'Experience' : 'Опыт',
        slug: 'experience',
        icon: 'fa6-solid:suitcase',
        visible: true
      },
      jobs: []
    },
    portfolio: {
      config: {
        title: locale === 'en' ? 'Projects' : 'Проекты',
        slug: 'projects',
        icon: 'fa6-solid:rocket',
        visible: true
      },
      projects: []
    },
    education: {
      config: {
        title: locale === 'en' ? 'Education' : 'Образование',
        slug: 'education',
        icon: 'fa6-solid:graduation-cap',
        visible: true
      },
      diplomas: []
    },
    testimonials: {
      config: {
        title: locale === 'en' ? 'Testimonials' : 'Отзывы',
        slug: 'testimonials',
        icon: 'fa6-solid:comment',
        visible: true
      },
      testimonials: []
    },
    favorites: {
      config: {
        title: locale === 'en' ? 'Favorites' : 'Избранное',
        slug: 'favorites',
        icon: 'fa6-solid:star',
        visible: true
      },
      books: { title: locale === 'en' ? 'Books' : 'Книги', data: [] },
      people: { title: locale === 'en' ? 'People' : 'Люди', data: [] },
      videos: { title: locale === 'en' ? 'Videos' : 'Видео', data: [] },
      medias: { title: locale === 'en' ? 'Media' : 'Медиа', data: [] }
    }
  };
}

// Field inventory collection
function collectFieldInventory(devscardData: any): FieldInventory {
  const inventory: FieldInventory = {};

  function traverse(obj: any, path: string = '', sectionType: string = '') {
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => traverse(item, `${path}[${index}]`, sectionType));
      } else {
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (sectionType) {
            if (!inventory[sectionType]) inventory[sectionType] = {};
            if (!inventory[sectionType][currentPath]) {
              inventory[sectionType][currentPath] = {
                count: 0,
                examples: [],
                types: new Set(),
              };
            }
            
            inventory[sectionType][currentPath].count++;
            if (inventory[sectionType][currentPath].examples.length < 3) {
              inventory[sectionType][currentPath].examples.push(value);
            }
            inventory[sectionType][currentPath].types.add(typeof value);
          }
          
          traverse(value, currentPath, sectionType);
        });
      }
    }
  }

  Object.entries(devscardData).forEach(([sectionType, sectionData]) => {
    traverse(sectionData, '', sectionType);
  });

  return inventory;
}

// Section type normalization
function normalizeSectionType(type: string): string {
  const mapping: Record<string, string> = {
    'skill': 'skills',
    'skills': 'skills',
    'grid': 'cards',
    'list': 'cards',
    'cards': 'cards',
    'experience': 'experience',
    'work': 'experience',
    'jobs': 'experience',
    'portfolio': 'projects',
    'projects': 'projects',
    'education': 'education',
    'edu': 'education',
    'testimonials': 'testimonials',
    'quotes': 'testimonials',
    'favorites': 'favorites',
    'links': 'favorites',
    'main': 'hero',
    'profile': 'hero',
    'hero': 'hero',
  };
  
  return mapping[type.toLowerCase()] || type.toLowerCase();
}

// Data mapping and transformation
function mapDevscardToAboutPage(devscardData: any, locale: string): any {
  const sections: any[] = [];
  const mapping: MappingSummary = {};

  // Map each DevsCard section to aboutPage format
  Object.entries(devscardData).forEach(([sectionType, sectionData]: [string, any]) => {
    const normalizedType = normalizeSectionType(sectionType);
    
    if (!mapping[normalizedType]) {
      mapping[normalizedType] = { explicit: [], passthrough: [], extras: [] };
    }

    let mappedSection: any = {
      type: normalizedType,
      data: {
        title: sectionData.config?.title || normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1),
      },
    };

    // Handle different section types
    switch (normalizedType) {
      case 'skills':
        if (sectionData.skillSets) {
          mappedSection.data.groups = sectionData.skillSets.map((skillSet: any) => ({
            title: skillSet.title,
            items: skillSet.skills?.map((skill: any) => ({
              name: skill.name,
              icon: skill.icon,
              url: skill.url,
              level: skill.level,
              description: skill.description,
              ...skill, // Include any additional fields via passthrough
            })) || [],
            ...skillSet, // Include additional fields
          }));
        }
        break;

      case 'experience':
        if (sectionData.jobs) {
          mappedSection.data.items = sectionData.jobs.map((job: any) => ({
            name: job.role || job.title,
            company: job.company,
            description: job.description,
            dates: job.dates,
            image: job.image,
            ...job, // Include additional fields
          }));
        }
        break;

      case 'projects':
        if (sectionData.projects) {
          mappedSection.data.items = sectionData.projects.map((project: any) => ({
            name: project.name,
            description: project.description,
            image: project.image,
            dates: project.dates,
            ...project, // Include additional fields
          }));
        }
        break;

      case 'education':
        if (sectionData.diplomas) {
          mappedSection.data.items = sectionData.diplomas.map((diploma: any) => ({
            name: diploma.title,
            institution: diploma.institution,
            description: diploma.description,
            dates: diploma.dates,
            ...diploma, // Include additional fields
          }));
        }
        break;

      case 'testimonials':
        if (sectionData.testimonials) {
          mappedSection.data.items = sectionData.testimonials.map((testimonial: any) => ({
            name: testimonial.author,
            content: testimonial.content,
            relation: testimonial.relation,
            image: testimonial.image,
            ...testimonial, // Include additional fields
          }));
        }
        break;

      case 'favorites':
        if (sectionData.books || sectionData.people || sectionData.videos || sectionData.medias) {
          mappedSection.data.groups = [];
          
          if (sectionData.books) {
            mappedSection.data.groups.push({
              title: sectionData.books.title,
              items: sectionData.books.data?.map((book: any) => ({
                name: book.title,
                author: book.author,
                url: book.url,
                image: book.image,
                ...book,
              })) || [],
            });
          }
          
          // Add other favorites categories similarly...
        }
        break;

      case 'hero':
        // Handle main/profile section
        mappedSection.data = {
          title: sectionData.config?.title || 'Profile',
          fullName: sectionData.fullName,
          role: sectionData.role,
          description: sectionData.description,
          image: sectionData.image,
          details: sectionData.details,
          links: sectionData.links,
          tags: sectionData.tags,
          action: sectionData.action,
          ...sectionData, // Include all additional fields
        };
        break;

      default:
        // Generic mapping for unknown sections
        mappedSection.data = {
          ...sectionData,
        };
        break;
    }

    sections.push(mappedSection);
  });

  // Create the final aboutPage structure
  const aboutPageData = {
    title: locale === 'en' ? 'About' : 'Обо мне',
    slug: `${locale}/about`,
    sections,
  };

  return { aboutPageData, mapping };
}

// File format detection and conversion
function detectFormat(filePath: string): 'md' | 'json' {
  const ext = extname(filePath).toLowerCase();
  return ext === '.json' ? 'json' : 'md';
}

function formatAsMarkdown(data: any): string {
  const frontmatter = yaml.stringify(data, { 
    indent: 2,
    lineWidth: -1,
    quotingType: '"',
    sortKeys: false,
  });
  
  return `---\n${frontmatter}---\n`;
}

// BOM handling and frontmatter validation
function stripBomAndValidateFrontmatter(content: string): { content: string; hasBom: boolean; firstLine: string } {
  let cleanContent = content;
  let hasBom = false;
  
  // Check for UTF-8 BOM (both charCodeAt and buffer methods)
  if (content.length >= 3 && content.charCodeAt(0) === 0xFEFF) {
    hasBom = true;
    cleanContent = content.slice(1);
  }
  
  const firstLine = cleanContent.split('\n')[0] || '';
  
  return { content: cleanContent, hasBom, firstLine };
}

function assertFrontmatterFormat(content: string, strict: boolean = false): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check first 4 bytes === '---\n'
  if (!content.startsWith('---\n')) {
    errors.push('Content does not start with "---\\n"');
  }
  
  // Check for frontmatter block
  const secondDashIndex = content.indexOf('---\n', 4);
  if (secondDashIndex === -1) {
    errors.push('No closing frontmatter delimiter found');
  }
  
  if (strict && errors.length > 0) {
    console.error('[ERROR] Frontmatter format validation failed:', errors);
    process.exit(1);
  }
  
  return { valid: errors.length === 0, errors };
}

function validateWrittenFile(filePath: string, strict: boolean = false): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const { data } = matter(content);
    
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      errors.push('Parsed frontmatter is empty or invalid');
    }
    
    if (!data.title) {
      errors.push('Title field is missing from frontmatter');
    }
    
    // Additional validation for aboutPage structure
    if (data.sections && !Array.isArray(data.sections)) {
      errors.push('Sections field must be an array');
    }
    
    if (strict && errors.length > 0) {
      console.error('[ERROR] Post-write validation failed:', errors);
      process.exit(1);
    }
    
  } catch (error) {
    errors.push(`Failed to parse written file: ${error}`);
    if (strict) {
      console.error('[ERROR] Post-write validation failed:', errors);
      process.exit(1);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

function formatAsJson(data: any, pretty: boolean = false): string {
  if (pretty) {
    return JSON.stringify(data, null, 2) + '\n';
  }
  return JSON.stringify(data) + '\n';
}

// Validation against content.config.ts schema
function validateAgainstSchema(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    // Basic validation - schema-aware requireds for top-level
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Missing or invalid title field');
    }
    
    // slug is now optional, so no validation needed
    
    if (!data.sections || !Array.isArray(data.sections)) {
      errors.push('Missing or invalid sections array');
    }
    
    // Validate sections structure
    data.sections?.forEach((section: any, index: number) => {
      if (!section.type || typeof section.type !== 'string') {
        errors.push(`Section ${index}: missing or invalid type`);
      }
      
      if (!section.data || typeof section.data !== 'object') {
        errors.push(`Section ${index}: missing or invalid data object`);
      }
    });
    
  } catch (error) {
    errors.push(`Validation error: ${error}`);
  }
  
  return { valid: errors.length === 0, errors };
}

// Main processing function
async function processLocale(locale: string, args: CliArgs): Promise<WriteDiff> {
  const writeDiff: WriteDiff = {};
  const outputPath = join(projectRoot, 'src', 'content', 'aboutPage', locale, 'about.md');
  
  console.log(`\n[INFO] Processing locale: ${locale}`);
  
  try {
    // Discover DevsCard data
    console.log(`[INFO] Discovering DevsCard data for ${locale}...`);
    const devscardData = await discoverDevscardData(locale as 'en' | 'ru');
    
    if (Object.keys(devscardData).length === 0) {
      console.log(`[WARN] No DevsCard data found for ${locale}, skipping...`);
      writeDiff[outputPath] = { action: 'skipped', sectionsCount: 0, warnings: ['No DevsCard data found'] };
      return writeDiff;
    }

    // Collect field inventory
    const fieldInventory = collectFieldInventory(devscardData);
    
    // Map data to aboutPage format
    const { aboutPageData, mapping } = mapDevscardToAboutPage(devscardData, locale);
    
    // Validate against schema
    const validation = validateAgainstSchema(aboutPageData);
    
    if (!validation.valid && args.strict) {
      console.error(`[ERROR] Validation failed for ${locale}:`, validation.errors);
      writeDiff[outputPath] = { action: 'skipped', sectionsCount: 0, errors: validation.errors };
      return writeDiff;
    }
    
    if (!validation.valid) {
      console.warn(`[WARN] Validation warnings for ${locale}:`, validation.errors);
    }

    // Determine output format
    const format = args.format === 'infer' ? detectFormat(outputPath) : args.format;
    const outputData = format === 'json' ? aboutPageData : aboutPageData;
    
    // Generate output content
    const content = format === 'md' ? formatAsMarkdown(outputData) : formatAsJson(outputData, args.pretty);
    
    if (args.debug) {
      console.log(`[DEBUG] Generated content for ${locale}:`);
      console.log(content.substring(0, 500) + '...');
    }

    // Write file if not dry run
    if (!args.dryRun && args.write) {
      // Create backup if requested
      if (args.backup && existsSync(outputPath)) {
        const backupPath = `${outputPath}.${Date.now()}.bak`;
        writeFileSync(backupPath, readFileSync(outputPath));
        console.log(`[INFO] Created backup: ${backupPath}`);
      }
      
      // Ensure directory exists
      mkdirSync(dirname(outputPath), { recursive: true });
      
      // Before writing: strip BOM and assert first 4 bytes === '---\n' in MD mode
      if (format === 'md') {
        const { content: cleanContent, hasBom, firstLine } = stripBomAndValidateFrontmatter(content);
        if (hasBom) {
          console.log(`[INFO] Stripped BOM from content for ${locale}`);
        }
        
        const formatValidation = assertFrontmatterFormat(cleanContent, args.strict);
        if (!formatValidation.valid) {
          console.warn(`[WARN] Frontmatter format issues for ${locale}:`, formatValidation.errors);
          if (args.strict) {
            console.error('[ERROR] Strict mode: frontmatter format validation failed');
            process.exit(1);
          }
        }
        
        // Ensure the first line is exactly '---' and write UTF-8 without BOM
        let finalContent = cleanContent;
        if (!finalContent.startsWith('---\n')) {
          finalContent = '---\n' + finalContent;
        }
        
        writeFileSync(outputPath, finalContent, 'utf-8');
      } else {
        writeFileSync(outputPath, content, 'utf-8');
      }
      
      console.log(`[INFO] Written: ${outputPath}`);
      
      // After writing: re-read and validate
      if (format === 'md') {
        const postWriteValidation = validateWrittenFile(outputPath, args.strict);
        if (!postWriteValidation.valid) {
          console.warn(`[WARN] Post-write validation issues for ${locale}:`, postWriteValidation.errors);
        }
      }
    }

    writeDiff[outputPath] = {
      action: args.dryRun ? 'skipped' : 'modified',
      sectionsCount: aboutPageData.sections?.length || 0,
      warnings: validation.valid ? undefined : validation.errors,
    };

    return writeDiff;

  } catch (error) {
    console.error(`[ERROR] Failed to process ${locale}:`, error);
    writeDiff[outputPath] = { action: 'skipped', sectionsCount: 0, errors: [String(error)] };
    return writeDiff;
  }
}

// Doctor report generation
function generateDoctorReport(filePath: string): { path: string; hasBom: boolean; firstLine: string; hasFrontmatter: boolean; keysTopLevel: string[]; errors: string[] } {
  const result = {
    path: filePath,
    hasBom: false,
    firstLine: '',
    hasFrontmatter: false,
    keysTopLevel: [] as string[],
    errors: [] as string[]
  };

  try {
    if (!existsSync(filePath)) {
      result.errors.push('File does not exist');
      return result;
    }

    const buffer = readFileSync(filePath);
    let content = buffer.toString('utf-8');
    
    // Check for UTF-8 BOM
    if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      result.hasBom = true;
      content = buffer.slice(3).toString('utf-8');
    }

    const lines = content.split('\n');
    result.firstLine = lines[0] || '';

    if (result.firstLine.trim() === '---') {
      result.hasFrontmatter = true;
    } else {
      result.errors.push('First line is not "---"');
    }

    // Parse frontmatter to get top-level keys
    try {
      const { data } = matter(content);
      result.keysTopLevel = Object.keys(data || {});
      
      // Additional validation
      if (!data || typeof data !== 'object') {
        result.errors.push('Frontmatter data is not an object');
      }
      
      if (!data.title) {
        result.errors.push('Title field is missing');
      }
      
      if (data.sections && !Array.isArray(data.sections)) {
        result.errors.push('Sections field is not an array');
      }
      
    } catch (error) {
      result.errors.push(`Failed to parse frontmatter: ${error}`);
    }

  } catch (error) {
    result.errors.push(`Failed to analyze file: ${error}`);
  }

  return result;
}

// Report generation
function generateReports(fieldInventory: FieldInventory, mapping: MappingSummary, writeDiff: WriteDiff) {
  const reportsDir = join(projectRoot, 'scripts', '.reports');
  
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }

  // Field inventory report
  const fieldInventoryPath = join(reportsDir, 'field-inventory.json');
  writeFileSync(fieldInventoryPath, JSON.stringify(fieldInventory, null, 2));
  console.log(`[INFO] Field inventory report: ${fieldInventoryPath}`);

  // Mapping summary report
  const mappingSummaryPath = join(reportsDir, 'mapping-summary.json');
  writeFileSync(mappingSummaryPath, JSON.stringify(mapping, null, 2));
  console.log(`[INFO] Mapping summary report: ${mappingSummaryPath}`);

  // Write diff report
  const writeDiffPath = join(reportsDir, 'write-diff.json');
  writeFileSync(writeDiffPath, JSON.stringify(writeDiff, null, 2));
  console.log(`[INFO] Write diff report: ${writeDiffPath}`);

  // Doctor report
  const doctorReport: any = {};
  const aboutPageDir = join(projectRoot, 'src', 'content', 'aboutPage');
  const locales = ['en', 'ru'];
  
  for (const locale of locales) {
    const filePath = join(aboutPageDir, locale, 'about.md');
    doctorReport[filePath] = generateDoctorReport(filePath);
  }
  
  const doctorPath = join(reportsDir, 'doctor.json');
  writeFileSync(doctorPath, JSON.stringify(doctorReport, null, 2));
  console.log(`[INFO] Doctor report: ${doctorPath}`);
}

// Main execution
async function main() {
  console.log('[INFO] Starting Content Formatter & Frontmatter Synthesizer...');
  
  const args = parseArgs();
  
  console.log('[INFO] Content Formatter & Frontmatter Synthesizer');
  console.log('[INFO] ===========================================');
  console.log(`[INFO] Dry run: ${args.dryRun}`);
  console.log(`[INFO] Write: ${args.write}`);
  console.log(`[INFO] Format: ${args.format}`);
  console.log(`[INFO] Languages: ${args.langs.join(', ')}`);
  console.log(`[INFO] Debug: ${args.debug}`);

  if (!args.write && !args.dryRun) {
    console.log('[INFO] Use --write to enable file writing or --dry-run for analysis only');
    return;
  }

  let allWriteDiff: WriteDiff = {};
  let allFieldInventory: FieldInventory = {};
  let allMapping: MappingSummary = {};

  // Process each locale
  for (const locale of args.langs) {
    try {
      const localeDiff = await processLocale(locale, args);
      Object.assign(allWriteDiff, localeDiff);
    } catch (error) {
      console.error(`[ERROR] Failed to process locale ${locale}:`, error);
    }
  }

  // Generate reports
  generateReports(allFieldInventory, allMapping, allWriteDiff);

  // Summary
  console.log('\n[INFO] ========== SUMMARY ==========');
  const modified = Object.values(allWriteDiff).filter(d => d.action === 'modified').length;
  const created = Object.values(allWriteDiff).filter(d => d.action === 'created').length;
  const skipped = Object.values(allWriteDiff).filter(d => d.action === 'skipped').length;
  
  console.log(`[INFO] Files modified: ${modified}`);
  console.log(`[INFO] Files created: ${created}`);
  console.log(`[INFO] Files skipped: ${skipped}`);
  
  const totalSections = Object.values(allWriteDiff).reduce((sum, d) => sum + d.sectionsCount, 0);
  console.log(`[INFO] Total sections processed: ${totalSections}`);
  
  if (Object.values(allWriteDiff).some(d => d.errors?.length)) {
    console.log('[WARN] Some files had errors - check the reports for details');
  }

  console.log('[INFO] Processing complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('content-formatter.ts')) {
  main().catch(console.error);
}

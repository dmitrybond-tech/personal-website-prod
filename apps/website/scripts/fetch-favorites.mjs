#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, statSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { globby } from 'globby';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import sharp from 'sharp';
import { fetch } from 'undici';
import stringSimilarity from 'string-similarity';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const FAVORITES_DIR = join(projectRoot, 'public', 'uploads', 'about', 'favorites');
const BACKUP_DIR = join(FAVORITES_DIR, '.backup');
const SOURCES_FILE = join(FAVORITES_DIR, '_sources.json');
const PLACEHOLDER_SIZE_THRESHOLD = 5000; // 5KB
const TARGET_SIZE = 160;
const MAX_FILE_SIZE = 90000; // 90KB

// CLI arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || !args.includes('--apply');
const onlyCategories = args.filter(arg => arg.startsWith('--only=')).map(arg => arg.split('=')[1].split(',')).flat();
const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '0') || Infinity;

// Load existing sources
let sources = {};
if (existsSync(SOURCES_FILE)) {
  try {
    sources = JSON.parse(readFileSync(SOURCES_FILE, 'utf8'));
  } catch (e) {
    console.warn('Could not load sources file:', e.message);
  }
}

/**
 * Parse markdown files to extract favorites items
 */
function parseFavoritesFromMD() {
  const mdFiles = [
    join(projectRoot, 'src', 'content', 'aboutPage', 'en', 'about-expanded.md'),
    join(projectRoot, 'src', 'content', 'aboutPage', 'ru', 'about-expanded.md')
  ];

  // Russian to English title mapping for better search results
  const titleMapping = {
    'Как создавать технологические продукты, которые любят клиенты': 'How to Create Tech Products Customers Love',
    'Шантарам': 'Shantaram',
    'Тонкое искусство пофигизма': 'The Subtle Art of Not Giving a Fuck',
    'Идиот': 'Idiot',
    'Преступление и наказание': 'Crime and Punishment',
    'Криминальное чтиво': 'Pulp Fiction',
    'Унесённые призраками': 'Spirited Away',
    'Большой Лебовски': 'The Big Lebowski',
    'Большой куш': 'Snatch',
    'Бойцовский клуб': 'Fight Club',
    'Джо Роган': 'Joe Rogan',
    'Сет Роген': 'Seth Rogen',
    'Марк Мэнсон': 'Mark Manson',
    'Трэвис Райс': 'Travis Rice',
    'Эндрю Хуберман': 'Andrew Huberman'
  };

  // Russian to English author mapping
  const authorMapping = {
    'Скотт Х.': 'Scott H.',
    'Грегори Дэвид Робертс': 'Gregory David Roberts',
    'Марк Мэнсон': 'Mark Manson',
    'Фёдор Достоевский': 'Fyodor Dostoevsky'
  };

  const favorites = [];

  for (const mdFile of mdFiles) {
    if (!existsSync(mdFile)) continue;

    try {
      const content = readFileSync(mdFile, 'utf8');
      
      // Manual YAML parsing since gray-matter has issues
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) || 
                              content.match(/^---([\s\S]*?)\n---\n([\s\S]*)$/) ||
                              content.match(/^---([\s\S]*)$/);
      if (!frontmatterMatch) {
        console.log(`No frontmatter found in ${basename(mdFile)}`);
        continue;
      }
      
      const yamlContent = frontmatterMatch[1];
      const data = yaml.load(yamlContent, { schema: yaml.DEFAULT_SCHEMA });
      
      const favoritesSection = data.sections?.find(s => s.type === 'favorites');
      if (!favoritesSection?.data?.groups) {
        continue;
      }

      for (const group of favoritesSection.data.groups) {
        if (onlyCategories.length > 0 && !onlyCategories.includes(group.type)) continue;

        for (const item of group.items || []) {
          const imagePath = item.image || item.logo || item.cover || item.avatar;
          if (!imagePath) continue;

          // Convert to relative path from favorites directory
          const relativePath = imagePath.replace('/uploads/about/favorites/', '');
          const fullPath = join(FAVORITES_DIR, relativePath);

          if (existsSync(fullPath)) {
            const stats = statSync(fullPath);
            const isPlaceholder = stats.size < PLACEHOLDER_SIZE_THRESHOLD || 
                                 basename(relativePath).includes('placeholder') ||
                                 basename(relativePath).includes('stub');

            if (isPlaceholder) {
              // Use English title and author if available for better search results
              const englishTitle = titleMapping[item.title || item.name] || (item.title || item.name);
              const englishAuthor = authorMapping[item.author] || item.author;
              
              favorites.push({
                category: group.type,
                itemName: item.title || item.name,
                englishTitle,
                author: item.author,
                englishAuthor,
                targetPath: fullPath,
                relativePath,
                query: generateQuery({ ...item, title: englishTitle, author: englishAuthor }, group.type)
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn(`Error parsing ${mdFile}:`, e.message);
    }
  }

  return favorites.slice(0, limit);
}

/**
 * Generate search query for an item
 */
function generateQuery(item, category) {
  const title = item.title || item.name || '';
  const author = item.author || '';

  switch (category) {
    case 'medias':
      return `${title} logo svg`;
    case 'books':
      return `${title} book cover ${author}`;
    case 'movies':
      return `${title} film poster movie`;
    case 'people':
      return `${title} portrait photo`;
    case 'hobbies':
      return `${title} icon illustration`;
    default:
      return title;
  }
}

/**
 * Fetch logo from Simple Icons
 */
async function fetchLogoFromSimpleIcons(name) {
  try {
    const iconName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const url = `https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/${iconName}.svg`;
    
    const response = await fetch(url);
    if (response.ok) {
      const svgBuffer = await response.arrayBuffer();
      return Buffer.from(svgBuffer);
    }
  } catch (e) {
    // Ignore errors
  }
  return null;
}

/**
 * Fetch Wikipedia lead image
 */
async function fetchWikipediaLeadImage(title, typeHint = '') {
  try {
    // Search for the page
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const response = await fetch(searchUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (data.thumbnail?.source) {
        // Get higher resolution version
        const imageUrl = data.thumbnail.source.replace(/\/\d+px-/, '/800px-');
        const imageResponse = await fetch(imageUrl);
        if (imageResponse.ok) {
          return await imageResponse.arrayBuffer();
        }
      }
    }
  } catch (e) {
    // Ignore errors
  }
  return null;
}

/**
 * Fetch Open Library book cover
 */
async function fetchOpenLibraryCover(title, author = '') {
  try {
    const searchQuery = `${title} ${author}`.trim();
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=1`;
    
    const response = await fetch(searchUrl);
    if (response.ok) {
      const data = await response.json();
      const book = data.docs?.[0];
      
      if (book?.cover_i) {
        const coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
        const coverResponse = await fetch(coverUrl);
        if (coverResponse.ok) {
          return await coverResponse.arrayBuffer();
        }
      }
    }
  } catch (e) {
    // Ignore errors
  }
  return null;
}

/**
 * Process image with Sharp
 */
async function processImage(buffer, targetPath) {
  try {
    const ext = extname(targetPath).toLowerCase();
    let sharpInstance = sharp(buffer)
      .resize(TARGET_SIZE, TARGET_SIZE, {
        fit: 'cover',
        position: 'attention'
      });

    let outputBuffer;
    let quality = 78;

    switch (ext) {
      case '.png':
        outputBuffer = await sharpInstance
          .png({ compressionLevel: 9 })
          .toBuffer();
        break;
      case '.jpg':
      case '.jpeg':
        outputBuffer = await sharpInstance
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
        break;
      case '.webp':
        outputBuffer = await sharpInstance
          .webp({ quality })
          .toBuffer();
        break;
      default:
        // Keep original format
        outputBuffer = await sharpInstance.toBuffer();
    }

    // If too large, try reducing quality
    if (outputBuffer.length > MAX_FILE_SIZE && (ext === '.jpg' || ext === '.jpeg' || ext === '.webp')) {
      quality = Math.max(60, quality - 15);
      outputBuffer = await sharp(buffer)
        .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'cover', position: 'attention' })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    }

    return outputBuffer;
  } catch (e) {
    console.warn('Error processing image:', e.message);
    return null;
  }
}

/**
 * Fetch image for a favorite item
 */
async function fetchImageForItem(item) {
  const { category, query, author, englishTitle, englishAuthor } = item;
  let buffer = null;
  let source = '';
  let method = '';

  // Try different sources based on category
  switch (category) {
    case 'medias':
      // Try Simple Icons first
      buffer = await fetchLogoFromSimpleIcons(item.itemName);
      if (buffer) {
        method = 'simple-icons';
        source = `https://simpleicons.org/?q=${encodeURIComponent(item.itemName)}`;
      } else {
        // Fallback to Wikipedia
        buffer = await fetchWikipediaLeadImage(item.itemName);
        if (buffer) {
          method = 'wikipedia';
          source = `https://en.wikipedia.org/wiki/${encodeURIComponent(item.itemName)}`;
        }
      }
      break;

    case 'books':
      // Try Open Library first with English title and author
      buffer = await fetchOpenLibraryCover(englishTitle || item.itemName, englishAuthor || author);
      if (buffer) {
        method = 'openlibrary';
        source = `https://openlibrary.org/search?q=${encodeURIComponent(englishTitle || item.itemName)}`;
      } else {
        // Fallback to Wikipedia
        buffer = await fetchWikipediaLeadImage(englishTitle || item.itemName);
        if (buffer) {
          method = 'wikipedia';
          source = `https://en.wikipedia.org/wiki/${encodeURIComponent(englishTitle || item.itemName)}`;
        }
      }
      break;

    case 'movies':
      // Try Wikipedia for movie posters
      buffer = await fetchWikipediaLeadImage(englishTitle || item.itemName);
      if (buffer) {
        method = 'wikipedia';
        source = `https://en.wikipedia.org/wiki/${encodeURIComponent(englishTitle || item.itemName)}`;
      }
      break;

    case 'people':
      // Try Wikipedia for portraits
      buffer = await fetchWikipediaLeadImage(englishTitle || item.itemName);
      if (buffer) {
        method = 'wikipedia';
        source = `https://en.wikipedia.org/wiki/${encodeURIComponent(englishTitle || item.itemName)}`;
      }
      break;

    case 'hobbies':
      // Try Wikipedia for hobby-related images
      buffer = await fetchWikipediaLeadImage(item.itemName);
      if (buffer) {
        method = 'wikipedia';
        source = `https://en.wikipedia.org/wiki/${encodeURIComponent(item.itemName)}`;
      }
      break;
  }

  if (!buffer) {
    return null;
  }

  // Process the image
  const processedBuffer = await processImage(buffer, item.targetPath);
  if (!processedBuffer) {
    return null;
  }

  return {
    buffer: processedBuffer,
    source,
    method,
    bytes: processedBuffer.length
  };
}

/**
 * Backup original file
 */
function backupOriginal(targetPath, relativePath) {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const backupPath = join(BACKUP_DIR, relativePath);
  const backupDir = dirname(backupPath);
  
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  if (!existsSync(backupPath)) {
    copyFileSync(targetPath, backupPath);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Discovering favorites placeholders...');
  
  const favorites = parseFavoritesFromMD();
  console.log(`Found ${favorites.length} placeholder images to process`);

  if (favorites.length === 0) {
    console.log('No placeholders found. Exiting.');
    return;
  }

  // Group by category for better output
  const byCategory = favorites.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  console.log('\n📋 Categories to process:');
  Object.entries(byCategory).forEach(([category, items]) => {
    console.log(`  ${category}: ${items.length} items`);
  });

  if (isDryRun) {
    console.log('\n🔍 DRY RUN - No files will be modified');
    console.log('\nPlanned replacements:');
    console.log('┌─────────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ Category │ Item Name                    │ Target Path                          │');
    console.log('├─────────────────────────────────────────────────────────────────────────────────┤');
    
    for (const item of favorites) {
      const category = item.category.padEnd(8);
      const name = (item.itemName || 'Unknown').padEnd(28);
      const path = item.relativePath.padEnd(35);
      console.log(`│ ${category} │ ${name} │ ${path} │`);
    }
    console.log('└─────────────────────────────────────────────────────────────────────────────────┘');
    return;
  }

  console.log('\n🚀 Starting image fetching and processing...');
  
  let successCount = 0;
  let failCount = 0;

  for (const item of favorites) {
    try {
      console.log(`\n📥 Processing: ${item.itemName} (${item.category})`);
      
      const result = await fetchImageForItem(item);
      if (!result) {
        console.log(`❌ No suitable image found for ${item.itemName}`);
        failCount++;
        continue;
      }

      // Backup original
      backupOriginal(item.targetPath, item.relativePath);

      // Write new image
      writeFileSync(item.targetPath, result.buffer);
      
      // Update sources
      sources[item.relativePath] = {
        source: result.source,
        license: 'Unknown',
        fetchedAt: new Date().toISOString(),
        method: result.method,
        bytes: result.bytes
      };

      console.log(`✅ Successfully replaced ${item.itemName} (${result.bytes} bytes, ${result.method})`);
      successCount++;

    } catch (e) {
      console.log(`❌ Error processing ${item.itemName}:`, e.message);
      failCount++;
    }
  }

  // Save sources file
  writeFileSync(SOURCES_FILE, JSON.stringify(sources, null, 2));

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully processed: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📁 Sources saved to: ${SOURCES_FILE}`);
  console.log(`💾 Backups saved to: ${BACKUP_DIR}`);
}

// Run the script
main().catch(console.error);

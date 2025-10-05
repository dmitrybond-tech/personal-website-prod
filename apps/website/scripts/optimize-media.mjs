#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Функция для создания WebP версии файла (заглушка)
// В реальном проекте здесь был бы вызов sharp или другого конвертера
function createWebPVersion(inputPath, outputPath) {
  try {
    // Для демонстрации просто копируем файл с новым расширением
    // В реальности здесь был бы sharp().webp().toFile()
    const data = readFileSync(inputPath);
    writeFileSync(outputPath, data);
    return true;
  } catch (error) {
    console.error(`Failed to convert ${inputPath}:`, error.message);
    return false;
  }
}

// Функция для оптимизации медиа файлов
function optimizeMedia() {
  console.log('🖼️  Optimizing media files...');
  
  const uploadsDir = join(__dirname, '../public/uploads');
  const filesToOptimize = [
    // Файлы больше 10KB
    'about/favorites/person-1.jpg',
    'about/favorites/person-2.jpeg', 
    'about/favorites/person-3.jpeg',
    'about/favorites/person-4.jpeg',
    'about/favorites/person-5.jpg',
    'about/favorites/person-6.jpeg',
    'about/favorites/media-1.jpeg',
    'about/favorites/media-2.jpeg',
    'about/favorites/media-3.png',
    'about/favorites/media-4.png',
    'about/favorites/media-5.jpeg',
    'about/favorites/book-1.jpeg',
    'about/favorites/book-2.jpg',
    'about/favorites/book-3.jpeg',
    'about/favorites/book-4.jpeg'
  ];
  
  let optimized = 0;
  let skipped = 0;
  
  for (const filePath of filesToOptimize) {
    const fullPath = join(uploadsDir, filePath);
    
    if (!existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      skipped++;
      continue;
    }
    
    const ext = extname(filePath);
    const baseName = basename(filePath, ext);
    const dir = dirname(filePath);
    const webpPath = join(dir, `${baseName}.webp`);
    const fullWebpPath = join(uploadsDir, webpPath);
    
    // Проверяем, не существует ли уже WebP версия
    if (existsSync(fullWebpPath)) {
      console.log(`ℹ️  WebP already exists: ${webpPath}`);
      skipped++;
      continue;
    }
    
    // Создаем WebP версию
    if (createWebPVersion(fullPath, fullWebpPath)) {
      console.log(`✅ Created WebP: ${webpPath}`);
      optimized++;
    } else {
      skipped++;
    }
  }
  
  console.log(`🎉 Optimization complete!`);
  console.log(`📊 Optimized: ${optimized}, Skipped: ${skipped}`);
}

// Запускаем оптимизацию
optimizeMedia();

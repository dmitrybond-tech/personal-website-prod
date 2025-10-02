#!/usr/bin/env tsx

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Import existing data sources
import { getDevscardData } from '../../src/features/about/devscard/lib/getDevscardData.js';
import { CAL_EVENT_TYPES } from '../../src/app/data/cal/event-types.js';

interface AboutBlock {
  type: 'heading' | 'text' | 'items';
  text?: string;
  md?: string;
  items?: Array<{ label: string; value: string }>;
}

interface BookMeEvent {
  id: string;
  label: string;
  link: string;
}

interface AboutPageData {
  route: string;
  lang: string;
  title: string;
  blocks: AboutBlock[];
}

interface BookMePageData {
  route: string;
  lang: string;
  title: string;
  intro?: string;
  events: BookMeEvent[];
}

function transformAboutData(locale: 'en' | 'ru'): AboutPageData {
  const data = getDevscardData(locale);
  const { config, sections } = data;
  
  const blocks: AboutBlock[] = [
    {
      type: 'heading',
      text: locale === 'en' ? 'About Me' : 'Обо мне'
    },
    {
      type: 'text',
      md: sections.main.description
    },
    {
      type: 'heading',
      text: locale === 'en' ? 'Contact Information' : 'Контактная информация'
    },
    {
      type: 'items',
      items: sections.main.details.map(detail => ({
        label: detail.label,
        value: detail.value
      }))
    },
    {
      type: 'heading',
      text: locale === 'en' ? 'Skills & Experience' : 'Навыки и опыт'
    },
    {
      type: 'text',
      md: locale === 'en' 
        ? '**Frontend Development**: React, Vue, Astro, TypeScript\n\n**Backend Development**: Node.js, Python, Go\n\n**DevOps**: Docker, CI/CD, Cloud platforms\n\n**Database**: PostgreSQL, MongoDB, Redis'
        : '**Frontend разработка**: React, Vue, Astro, TypeScript\n\n**Backend разработка**: Node.js, Python, Go\n\n**DevOps**: Docker, CI/CD, облачные платформы\n\n**Базы данных**: PostgreSQL, MongoDB, Redis'
    }
  ];

  return {
    route: locale === 'en' ? '/en/about' : '/ru/about',
    lang: locale,
    title: locale === 'en' ? 'About Me' : 'Обо мне',
    blocks
  };
}

function transformBookMeData(locale: 'en' | 'ru'): BookMePageData {
  const events: BookMeEvent[] = CAL_EVENT_TYPES.map(event => ({
    id: event.id,
    label: event.i18n[locale].title,
    link: event.calLink
  }));

  return {
    route: locale === 'en' ? '/en/bookme' : '/ru/bookme',
    lang: locale,
    title: locale === 'en' ? 'Book a meeting' : 'Записаться на встречу',
    intro: locale === 'en' 
      ? 'Choose your preferred meeting type and schedule a time that works for you.'
      : 'Выберите предпочитаемый тип встречи и назначьте время, которое вам подходит.',
    events
  };
}

function ensureDirectoryExists(dirPath: string): void {
  try {
    mkdirSync(dirPath, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
  }
}

function writeJsonFile(filePath: string, data: any): void {
  const jsonContent = JSON.stringify(data, null, 2);
  writeFileSync(filePath, jsonContent, 'utf8');
  console.log(`✓ Created: ${filePath}`);
}

async function seedPages(): Promise<void> {
  console.log('🌱 Seeding CMS pages...\n');

  // Create About pages
  const aboutEn = transformAboutData('en');
  const aboutRu = transformAboutData('ru');
  
  const aboutEnPath = join(process.cwd(), 'content', 'pages', 'about', 'en.json');
  const aboutRuPath = join(process.cwd(), 'content', 'pages', 'about', 'ru.json');
  
  ensureDirectoryExists(join(process.cwd(), 'content', 'pages', 'about'));
  writeJsonFile(aboutEnPath, aboutEn);
  writeJsonFile(aboutRuPath, aboutRu);

  // Create BookMe pages
  const bookmeEn = transformBookMeData('en');
  const bookmeRu = transformBookMeData('ru');
  
  const bookmeEnPath = join(process.cwd(), 'content', 'pages', 'bookme', 'en.json');
  const bookmeRuPath = join(process.cwd(), 'content', 'pages', 'bookme', 'ru.json');
  
  ensureDirectoryExists(join(process.cwd(), 'content', 'pages', 'bookme'));
  writeJsonFile(bookmeEnPath, bookmeEn);
  writeJsonFile(bookmeRuPath, bookmeRu);

  console.log('\n✅ CMS pages seeded successfully!');
  console.log('\nNext steps:');
  console.log('1. Commit the generated JSON files to your repository');
  console.log('2. Run `npm run cms:dev` to start the development server');
  console.log('3. Access the CMS at http://localhost:4321/website-admin/');
}

// Run the seed script
seedPages().catch(console.error);

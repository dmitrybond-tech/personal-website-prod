import { getEntry } from 'astro:content';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

export interface BookmeModel {
  page_title?: string;
  page_subtitle?: string;
  cal: {
    handle: string;
    eventType?: string;
    attrs?: Record<string, string>;
  };
  tiles: Array<{
    id: string;
    title: string;
    description?: string;
    image?: string;
    cta_text: string;
    cta_kind: 'cal' | 'link' | 'mailto' | 'download';
    cal_preset?: string;
    href?: string;
    visible: boolean;
    icon?: string;
  }>;
  footer_note?: string;
}

/**
 * Loads Book.me page content with fallback mechanism:
 * 1. Try to load from Astro Content Collections
 * 2. Fallback to reference data from website-vanilla_ref
 * 3. Fallback to English if Russian is missing
 */
export async function getBookme(lang: 'en' | 'ru'): Promise<BookmeModel> {
  try {
    // Try to load from Content Collections first
    const bookmeConfig = await getEntry('bookmeConfig', `${lang}/config`);
    
    if (bookmeConfig) {
      return bookmeConfig.data;
    }
  } catch (error) {
    console.warn(`Failed to load Book.me config from Content Collections for ${lang}:`, error);
  }

  // Fallback to reference data
  try {
    const referenceData = loadReferenceData(lang);
    if (referenceData) {
      return referenceData;
    }
  } catch (error) {
    console.warn(`Failed to load reference data for ${lang}:`, error);
  }

  // Final fallback: try English if we were looking for Russian
  if (lang === 'ru') {
    try {
      const englishData = loadReferenceData('en');
      if (englishData) {
        return englishData;
      }
    } catch (error) {
      console.warn('Failed to load English fallback data:', error);
    }
  }

  // Ultimate fallback
  return {
    page_title: lang === 'ru' ? 'Записаться на встречу' : 'Book a Meeting',
    page_subtitle: lang === 'ru' ? 'Запланируйте звонок для обсуждения вашего проекта' : 'Schedule a call to discuss your project',
    cal: {
      handle: 'dima-bond-git',
      eventType: 'intro',
    },
    tiles: [
      {
        id: 'intro-30',
        title: lang === 'ru' ? 'Знакомство' : 'Intro call',
        description: lang === 'ru' ? '30 минут' : '30 min',
        cta_text: lang === 'ru' ? 'Записаться' : 'Book',
        cta_kind: 'cal',
        cal_preset: 'dima-bond-git/intro-30m',
        visible: true,
        icon: 'calendar',
      },
    ],
    footer_note: lang === 'ru' ? 'Я доступен для консультаций, менторства и обсуждения проектов.' : 'I\'m available for consultation, mentoring, and project discussions.',
  };
}

/**
 * Loads reference data from website-vanilla_ref
 */
function loadReferenceData(lang: 'en' | 'ru'): BookmeModel | null {
  try {
    // Try to load from the reference folder structure
    const referencePath = join(process.cwd(), '..', 'website-vanilla_ref', 'src', 'content', lang);
    const bookmeDataPath = join(referencePath, 'bookme.ts');
    
    if (bookmeDataPath) {
      const bookmeContent = readFileSync(bookmeDataPath, 'utf-8');
      
      // Extract data from the TypeScript file (simple parsing)
      const titleMatch = bookmeContent.match(/title:\s*['"`]([^'"`]+)['"`]/);
      const subtitleMatch = bookmeContent.match(/subtitle:\s*['"`]([^'"`]+)['"`]/);
      const descriptionMatch = bookmeContent.match(/description:\s*['"`]([^'"`]+)['"`]/);
      
      const title = titleMatch?.[1] || (lang === 'ru' ? 'Записаться на встречу' : 'Book a Meeting');
      const subtitle = subtitleMatch?.[1] || (lang === 'ru' ? 'Запланируйте звонок для обсуждения вашего проекта' : 'Schedule a call to discuss your project');
      const description = descriptionMatch?.[1] || (lang === 'ru' ? 'Я доступен для консультаций, менторства и обсуждения проектов.' : 'I\'m available for consultation, mentoring, and project discussions.');
      
      return {
        page_title: title,
        page_subtitle: subtitle,
        cal: {
          handle: 'dima-bond-git',
          eventType: 'intro',
        },
        tiles: [
          {
            id: 'intro-30',
            title: lang === 'ru' ? 'Знакомство' : 'Intro call',
            description: lang === 'ru' ? '30 минут' : '30 min',
            cta_text: lang === 'ru' ? 'Записаться' : 'Book',
            cta_kind: 'cal',
            cal_preset: 'dima-bond-git/intro-30m',
            visible: true,
            icon: 'calendar',
          },
          {
            id: 'tech-consultation',
            title: lang === 'ru' ? 'Техническая консультация' : 'Technical Consultation',
            description: lang === 'ru' ? '90 минут' : '90 min',
            cta_text: lang === 'ru' ? 'Записаться' : 'Book',
            cta_kind: 'cal',
            cal_preset: 'dima-bond-git/tech-90m',
            visible: true,
            icon: 'code',
          },
          {
            id: 'mentoring',
            title: lang === 'ru' ? 'Менторинг' : 'Mentoring',
            description: lang === 'ru' ? '60 минут' : '60 min',
            cta_text: lang === 'ru' ? 'Записаться' : 'Book',
            cta_kind: 'cal',
            cal_preset: 'dima-bond-git/mentoring-60m',
            visible: true,
            icon: 'graduation-cap',
          },
        ],
        footer_note: description,
      };
    }
  } catch (error) {
    console.warn(`Failed to load reference data for ${lang}:`, error);
    return null;
  }
  
  return null;
}

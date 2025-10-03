import { getEntry } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export interface SkillItem {
  name: string;
  icon?: string;
  url?: string;
  level?: 1 | 2 | 3 | 4 | 5;
  description?: {
    en?: string;
    ru?: string;
  };
}

export interface SkillGroup {
  title: string;
  items: SkillItem[];
}

export interface SkillsData {
  title: string;
  groups: SkillGroup[];
}

/**
 * Load skills data from CMS with i18n support
 */
export async function loadSkillsData(lang: 'en' | 'ru'): Promise<SkillsData | null> {
  try {
    const slug = `${lang}/about`;
    const entry = await getEntry({ collection: 'aboutPage', slug });
    
    if (!entry) {
      console.warn(`[skills] No about page found for lang: ${lang}`);
      return null;
    }

    // Find skills section
    const skillsSection = entry.data.sections?.find(section => section.type === 'skills');
    
    if (!skillsSection || !skillsSection.data?.groups) {
      console.warn(`[skills] No skills section found for lang: ${lang}`);
      return getFallbackSkillsData(lang);
    }

    const { groups } = skillsSection.data;
    
    return {
      title: skillsSection.heading || (lang === 'en' ? 'Skills' : 'Навыки'),
      groups: groups.map((group: any) => ({
        title: group.title || '',
        items: (group.items || []).map((item: any) => ({
          name: item.name || '',
          icon: item.icon,
          url: item.url,
          level: item.level ? Math.max(1, Math.min(5, item.level)) as 1 | 2 | 3 | 4 | 5 : undefined,
          description: item.description ? {
            en: item.description.en,
            ru: item.description.ru
          } : undefined
        }))
      }))
    };
  } catch (error) {
    console.error(`[skills] Error loading skills data for lang: ${lang}`, error);
    return getFallbackSkillsData(lang);
  }
}

/**
 * Get localized description for a skill item
 */
export function getLocalizedDescription(item: SkillItem, lang: 'en' | 'ru'): string | undefined {
  if (!item.description) return undefined;
  
  const localized = item.description[lang];
  if (localized) return localized;
  
  // Fallback to other language if current not available
  const fallback = item.description[lang === 'en' ? 'ru' : 'en'];
  if (fallback && process.env.NODE_ENV === 'development') {
    console.warn(`[skills] Missing ${lang} description for skill "${item.name}", using fallback`);
  }
  
  return fallback;
}

/**
 * Fallback skills data for development/testing
 */
function getFallbackSkillsData(lang: 'en' | 'ru'): SkillsData {
  const isEn = lang === 'en';
  
  return {
    title: isEn ? 'Skills' : 'Навыки',
    groups: [
      {
        title: isEn ? 'I already know' : 'Уже умею',
        items: [
          {
            name: 'React.js',
            icon: 'simple-icons:react',
            url: 'https://reactjs.org/',
            level: 5,
            description: {
              en: 'Advanced React development with hooks, context, and modern patterns',
              ru: 'Продвинутая разработка на React с хуками, контекстом и современными паттернами'
            }
          },
          {
            name: 'TypeScript',
            icon: 'simple-icons:typescript',
            url: 'https://www.typescriptlang.org/',
            level: 4,
            description: {
              en: 'Strong typing and modern JavaScript features',
              ru: 'Строгая типизация и современные возможности JavaScript'
            }
          },
          {
            name: 'Astro',
            icon: 'simple-icons:astro',
            url: 'https://astro.build/',
            level: 3,
            description: {
              en: 'Static site generation and modern web development',
              ru: 'Генерация статических сайтов и современная веб-разработка'
            }
          }
        ]
      },
      {
        title: isEn ? 'I want to learn' : 'Хочу выучить',
        items: [
          {
            name: 'Rust',
            icon: 'simple-icons:rust',
            url: 'https://www.rust-lang.org/'
          },
          {
            name: 'WebAssembly',
            icon: 'simple-icons:webassembly',
            url: 'https://webassembly.org/'
          }
        ]
      },
      {
        title: isEn ? 'I speak' : 'Языки',
        items: [
          {
            name: isEn ? 'English - C1' : 'Английский — C1',
            icon: 'circle-flags:us'
          },
          {
            name: isEn ? 'Russian - Native' : 'Русский — Родной',
            icon: 'circle-flags:ru'
          }
        ]
      }
    ]
  };
}

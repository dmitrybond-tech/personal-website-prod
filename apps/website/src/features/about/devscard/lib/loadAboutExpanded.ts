import { readFileSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import type { Data } from '../types/data';
import type { AboutExpanded } from './aboutExpandedSchema';
import { AboutExpandedSchema } from './aboutExpandedSchema';
import { mapAboutExpandedToLegacy } from './aboutExpandedAdapter';

/**
 * Loads and parses the about-expanded.md file for the given locale
 */
export async function loadAboutExpanded(locale: 'en' | 'ru'): Promise<Data> {
  const fileName = `about-expanded.md`;
  const filePath = join(process.cwd(), 'apps/website/src/content/aboutPage', locale, fileName);
  
  try {
    const fileContent = readFileSync(filePath, 'utf-8');
    const { data: frontmatter } = matter(fileContent);
    
    // Validate the parsed frontmatter against our schema
    const validatedData: AboutExpanded = AboutExpandedSchema.parse(frontmatter);
    
    // Map to legacy format
    return mapAboutExpandedToLegacy(validatedData);
  } catch (error) {
    console.error(`Failed to load about-expanded.md for locale ${locale}:`, error);
    
    // Return fallback data structure
    return createFallbackData(locale);
  }
}

/**
 * Creates fallback data when the about-expanded.md file is not available
 */
function createFallbackData(locale: 'en' | 'ru'): Data {
  const isRussian = locale === 'ru';
  
  return {
    config: {
      meta: {
        title: isRussian ? 'Обо мне' : 'About',
        description: '',
        image: '',
        url: '',
      },
      i18n: {
        locale,
        dateFormat: 'MMM yyyy',
        translations: {
          now: isRussian ? 'Настоящее время' : 'Present',
        },
      },
      pdf: {
        format: 'A4',
        margin: '20mm',
        scale: 0.8,
      },
    },
    sections: {
      main: {
        config: {
          title: isRussian ? 'Профиль' : 'Profile',
          slug: 'profile',
          icon: 'fa6-solid:user' as any,
          visible: true,
        },
        image: '/devscard/my-image.jpeg',
        fullName: isRussian ? 'Дмитрий Бондаренко' : 'Dmitry Bondarenko',
        role: isRussian ? 'Технический менеджер проектов' : 'Technical Project Manager',
        details: [],
        description: isRussian 
          ? 'Опытный IT-энтузиаст и технический менеджер проектов с более чем восьмилетним опытом работы с крупными предприятиями.'
          : 'Experienced IT enthusiast and Technical Project Manager with more than eight years of experience working with large enterprises.',
        tags: [],
        action: {
          label: isRussian ? 'Скачать резюме' : 'Download CV',
          url: '/devscard/cv.pdf',
        },
        links: [],
      },
      skills: {
        config: {
          title: isRussian ? 'Навыки' : 'Skills',
          slug: 'skills',
          icon: 'fa6-solid:bars-progress' as any,
          visible: true,
        },
        skillSets: [],
      },
      experience: {
        config: {
          title: isRussian ? 'Опыт' : 'Experience',
          slug: 'experience',
          icon: 'fa6-solid:briefcase' as any,
          visible: true,
        },
        jobs: [],
      },
      portfolio: {
        config: {
          title: isRussian ? 'Портфолио' : 'Portfolio',
          slug: 'portfolio',
          icon: 'fa6-solid:briefcase' as any,
          visible: false,
        },
        projects: [],
        screenshots: {
          alt: '',
          ratio: '16:9' as any,
        },
      },
      education: {
        config: {
          title: isRussian ? 'Образование' : 'Education',
          slug: 'education',
          icon: 'fa6-solid:graduation-cap' as any,
          visible: false,
        },
        schools: [],
      },
      testimonials: {
        config: {
          title: isRussian ? 'Рекомендации' : 'Testimonials',
          slug: 'testimonials',
          icon: 'fa6-solid:quote-left' as any,
          visible: false,
        },
        testimonials: [],
      },
      favorites: {
        config: {
          title: isRussian ? 'Избранное' : 'Favorites',
          slug: 'favorites',
          icon: 'fa6-solid:star' as any,
          visible: true,
        },
      },
    },
  };
}

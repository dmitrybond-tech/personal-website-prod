import type { Data, Config, Sections } from '../types/data';
import type { MainSection } from '../types/sections/main-section.types';
import type { SkillsSection } from '../types/sections/skills-section.types';
import type { ExperienceSection } from '../types/sections/experience-section.types';
import type { FavoritesSection } from '../types/sections/favorites-section.types';
import type { EducationSection } from '../types/sections/education-section.types';
import type { PortfolioSection } from '../types/sections/portfolio-section.types';
import type { TestimonialsSection } from '../types/sections/testimonials-section.types';
import type { AboutExpanded, AboutExpandedSection } from './aboutExpandedSchema';
import { AboutExpandedSchema } from './aboutExpandedSchema';

/**
 * Adapter that maps AboutExpanded schema to legacy Data interface
 * This allows us to use the new about-expanded.md as the source of truth
 * while maintaining compatibility with existing components
 */
export function mapAboutExpandedToLegacy(expanded: AboutExpanded): Data {
  // Validate input data
  const validated = AboutExpandedSchema.parse(expanded);
  
  // Extract sections from the expanded format
  const sectionsMap = new Map<string, AboutExpandedSection>();
  validated.sections.forEach(section => {
    sectionsMap.set(section.type, section);
  });

  // Create default config (can be enhanced later)
  const config: Config = {
    meta: {
      title: validated.title,
      description: '',
      image: '',
      url: '',
    },
    i18n: {
      locale: validated.slug.startsWith('ru/') ? 'ru' : 'en',
      dateFormat: 'MMM yyyy',
      translations: {
        now: validated.slug.startsWith('ru/') ? 'Настоящее время' : 'Present',
      },
    },
    pdf: {
      format: 'A4',
      margin: '20mm',
      scale: 0.8,
    },
  };

  // Map sections to legacy format
  const sections: Sections = {
    main: mapMainSection(sectionsMap.get('main')),
    skills: mapSkillsSection(sectionsMap.get('skills')),
    experience: mapExperienceSection(sectionsMap.get('experience')),
    portfolio: mapPortfolioSection(sectionsMap.get('portfolio')),
    education: mapEducationSection(sectionsMap.get('education')),
    testimonials: mapTestimonialsSection(sectionsMap.get('testimonials')),
    favorites: mapFavoritesSection(sectionsMap.get('favorites')),
  };

  return { config, sections };
}

function mapMainSection(section?: AboutExpandedSection): MainSection {
  if (!section || section.type !== 'main') {
    return createDefaultMainSection();
  }

  const data = section.data;
  
  return {
    config: {
      title: data.title,
      slug: data.slug,
      icon: data.icon as any,
      visible: data.visible ?? true,
    },
    image: data.image,
    fullName: data.fullName,
    role: data.role,
    details: data.details.map(detail => ({
      label: detail.label,
      value: detail.value,
      url: detail.url,
    })),
    description: data.description,
    tags: data.tags.map(tag => ({
      name: tag.name,
    })),
    action: {
      label: data.action.label,
      url: data.action.url,
      downloadedFileName: data.action.downloadedFileName,
    },
    links: data.links.map(link => ({
      name: link.label,
      icon: link.icon as any,
      url: link.url,
    })),
  };
}

function mapSkillsSection(section?: AboutExpandedSection): SkillsSection {
  if (!section || section.type !== 'skills') {
    return createDefaultSkillsSection();
  }

  const data = section.data;
  
  return {
    config: {
      title: data.title,
      slug: data.slug,
      icon: data.icon as any,
      visible: data.visible ?? true,
    },
    skillSets: data.categories.map(category => ({
      title: category.title,
      skills: category.skills.map(skill => ({
        name: skill.name,
        icon: skill.icon as any,
        level: mapSkillLevel(skill.level),
        description: skill.description,
      })),
    })),
  };
}

function mapExperienceSection(section?: AboutExpandedSection): ExperienceSection {
  if (!section || section.type !== 'experience') {
    return createDefaultExperienceSection();
  }

  const data = section.data;
  
  return {
    config: {
      title: data.title,
      slug: data.slug,
      icon: data.icon as any,
      visible: data.visible ?? true,
    },
    jobs: data.items.flatMap(item => 
      item.roles.map(role => ({
        role: role.title,
        company: item.company,
        image: item.logo,
        dates: parseDateRange(role.period),
        description: role.description || '',
        tagsList: {
          title: 'Technologies',
          tags: (role.technologies || []).map(tech => ({ name: tech })),
        },
        links: (role.links || []).map(link => ({
          name: link.label,
          icon: 'fa6-solid:link' as any,
          url: link.url,
        })),
      }))
    ),
  };
}

function mapFavoritesSection(section?: AboutExpandedSection): FavoritesSection {
  if (!section || section.type !== 'favorites') {
    return createDefaultFavoritesSection();
  }

  const data = section.data;
  
  // Group favorites by type
  const books: any[] = [];
  const people: any[] = [];
  const videos: any[] = [];
  const medias: any[] = [];

  data.groups.forEach(group => {
    const items = group.items.slice(0, group.style?.limit || group.items.length);
    
    switch (group.type) {
      case 'books':
        books.push(...items.map(item => ({
          title: item.title,
          author: item.author || '',
          image: item.image || '',
          url: item.url || '',
        })));
        break;
      case 'people':
        people.push(...items.map(item => ({
          name: item.name || item.title,
          image: item.image || '',
          url: item.url,
        })));
        break;
      case 'videos':
        videos.push(...items.map(item => ({
          title: item.title,
          image: item.image || '',
          url: item.url || '',
        })));
        break;
      case 'medias':
        medias.push(...items.map(item => ({
          title: item.title,
          type: item.type || '',
          image: item.image || '',
          url: item.url || '',
        })));
        break;
    }
  });

  return {
    config: {
      title: data.title,
      slug: data.slug,
      icon: data.icon as any,
      visible: data.visible ?? true,
    },
    books: books.length > 0 ? { title: 'Books', data: books } : undefined,
    people: people.length > 0 ? { title: 'People', data: people } : undefined,
    videos: videos.length > 0 ? { title: 'Videos', data: videos } : undefined,
    medias: medias.length > 0 ? { title: 'Media', data: medias } : undefined,
  };
}

function mapPortfolioSection(section?: AboutExpandedSection): PortfolioSection {
  return {
    config: {
      title: 'Portfolio',
      slug: 'portfolio',
      icon: 'fa6-solid:briefcase' as any,
      visible: false,
    },
    projects: [],
    screenshots: {
      alt: '',
      ratio: '16:9' as any,
    },
  };
}

function mapEducationSection(section?: AboutExpandedSection): EducationSection {
  return {
    config: {
      title: 'Education',
      slug: 'education',
      icon: 'fa6-solid:graduation-cap' as any,
      visible: false,
    },
    schools: [],
  };
}

function mapTestimonialsSection(section?: AboutExpandedSection): TestimonialsSection {
  return {
    config: {
      title: 'Testimonials',
      slug: 'testimonials',
      icon: 'fa6-solid:quote-left' as any,
      visible: false,
    },
    testimonials: [],
  };
}

// Helper functions for creating default sections
function createDefaultMainSection(): MainSection {
  return {
    config: {
      title: 'Profile',
      slug: 'profile',
      icon: 'fa6-solid:user' as any,
      visible: true,
    },
    image: '/devscard/my-image.jpeg',
    fullName: 'Mark Freeman',
    role: 'Senior React Developer',
    details: [],
    description: '',
    tags: [],
    action: {
      label: 'Download CV',
      url: '/devscard/cv.pdf',
    },
    links: [],
  };
}

function createDefaultSkillsSection(): SkillsSection {
  return {
    config: {
      title: 'Skills',
      slug: 'skills',
      icon: 'fa6-solid:bars-progress' as any,
      visible: true,
    },
    skillSets: [],
  };
}

function createDefaultExperienceSection(): ExperienceSection {
  return {
    config: {
      title: 'Experience',
      slug: 'experience',
      icon: 'fa6-solid:briefcase' as any,
      visible: true,
    },
    jobs: [],
  };
}

function createDefaultFavoritesSection(): FavoritesSection {
  return {
    config: {
      title: 'Favorites',
      slug: 'favorites',
      icon: 'fa6-solid:star' as any,
      visible: true,
    },
  };
}

// Helper function to map skill levels from string to number
function mapSkillLevel(level: 'beginner' | 'intermediate' | 'advanced' | 'expert'): number {
  switch (level) {
    case 'beginner': return 1;
    case 'intermediate': return 3;
    case 'advanced': return 4;
    case 'expert': return 5;
    default: return 1;
  }
}

// Helper function to parse date ranges
function parseDateRange(period: string): [Date, Date | null] {
  const parts = period.split(' – ');
  if (parts.length !== 2) {
    return [new Date(), null];
  }

  const startDate = parseDate(parts[0]);
  const endDate = parts[1].toLowerCase().includes('present') || parts[1].toLowerCase().includes('настоящее') 
    ? null 
    : parseDate(parts[1]);

  return [startDate, endDate];
}

function parseDate(dateStr: string): Date {
  // Simple date parsing - can be enhanced
  const months: Record<string, number> = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
    'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3, 'май': 4, 'июн': 5,
    'июл': 6, 'авг': 7, 'сен': 8, 'окт': 9, 'ноя': 10, 'дек': 11,
  };

  const parts = dateStr.trim().toLowerCase().split(' ');
  if (parts.length >= 2) {
    const month = months[parts[0]];
    const year = parseInt(parts[1]);
    if (month !== undefined && !isNaN(year)) {
      return new Date(year, month, 1);
    }
  }

  return new Date();
}

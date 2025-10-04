import type { Data } from '../types/data';
import type { MainSection } from '../types/sections/main-section.types';
import type { SkillsSection } from '../types/sections/skills-section.types';
import type { ExperienceSection } from '../types/sections/experience-section.types';
import type { FavoritesSection } from '../types/sections/favorites-section.types';

interface AboutMdSection {
  type: string;
  data: any;
}

interface AboutMdData {
  title: string;
  slug: string;
  sections: AboutMdSection[];
}

/**
 * Converts about.md data structure to the format expected by devscard components
 */
export function convertAboutMdToDevscardData(aboutMdData: AboutMdData): Data {
  const sections: any = {};
  
  aboutMdData.sections.forEach(section => {
    switch (section.type) {
      case 'main':
        sections.main = convertMainSection(section.data);
        break;
      case 'skills':
        sections.skills = convertSkillsSection(section.data);
        break;
      case 'experience':
        sections.experience = convertExperienceSection(section.data);
        break;
      case 'favorites':
        sections.favorites = convertFavoritesSection(section.data);
        break;
      // Add more section types as needed
    }
  });

  return {
    config: {
      title: aboutMdData.title,
      slug: aboutMdData.slug,
    },
    sections
  };
}

function convertMainSection(data: any): MainSection {
  return {
    config: {
      icon: data.icon || 'fa6-solid:user',
      title: data.title || 'Profile',
      slug: data.slug || 'profile',
      visible: data.visible !== false,
    },
    image: data.image || '/devscard/my-image.jpeg',
    fullName: data.fullName || 'Mark Freeman',
    role: data.role || 'Senior React Developer',
    details: data.details || [],
    pdfDetails: data.details || [], // Use same details for PDF
    description: data.description || '',
    tags: data.tags || [],
    action: data.action || {
      label: 'Download CV',
      url: '/devscard/cv.pdf',
      downloadedFileName: 'CV-Mark_Freeman.pdf',
    },
    links: data.links || [],
  };
}

function convertSkillsSection(data: any): SkillsSection {
  return {
    config: {
      title: data.title || 'Skills',
      slug: data.slug || 'skills',
      icon: data.icon || 'fa6-solid:bars-progress',
      visible: data.visible !== false,
    },
    skillSets: data.skillSets || [],
  };
}

function convertExperienceSection(data: any): ExperienceSection {
  const jobs = data.items?.map((item: any) => ({
    role: item.roles?.[0]?.title || 'Position',
    company: item.company || 'Company',
    image: item.logo ? { src: item.logo, alt: `${item.company} logo` } : undefined,
    dates: {
      start: item.roles?.[0]?.period?.split(' – ')[0] || 'Start Date',
      end: item.roles?.[0]?.period?.split(' – ')[1] || 'End Date',
    },
    description: item.roles?.[0]?.description || '',
    tagsList: {
      tags: item.roles?.[0]?.technologies?.map((tech: string) => ({ name: tech })) || [],
    },
    links: item.roles?.[0]?.links || [],
  })) || [];

  return {
    config: {
      title: data.title || 'Experience',
      slug: data.slug || 'experience',
      icon: data.icon || 'fa6-solid:briefcase',
      visible: data.visible !== false,
    },
    jobs,
  };
}

function convertFavoritesSection(data: any): FavoritesSection {
  const result: FavoritesSection = {
    config: {
      title: data.title || 'Favorites',
      slug: data.slug || 'favorites',
      icon: data.icon || 'fa6-solid:star',
      visible: data.visible !== false,
    },
  };

  // Convert groups to the expected format
  data.groups?.forEach((group: any) => {
    switch (group.type) {
      case 'books':
        result.books = {
          title: group.title,
          data: group.items?.map((item: any) => ({
            title: item.title,
            author: item.author || '',
            url: item.url || '',
            image: item.image ? { src: item.image, alt: item.title } : { src: '', alt: item.title },
          })) || [],
        };
        break;
      case 'people':
        result.people = {
          title: group.title,
          data: group.items?.map((item: any) => ({
            name: item.name || item.title,
            url: item.url,
            image: item.image ? { src: item.image, alt: item.name || item.title } : { src: '', alt: item.name || item.title },
          })) || [],
        };
        break;
      case 'videos':
        result.videos = {
          title: group.title,
          data: group.items?.map((item: any) => ({
            title: item.title,
            url: item.url || '',
            image: item.image ? { src: item.image, alt: item.title } : { src: '', alt: item.title },
          })) || [],
        };
        break;
      case 'medias':
        result.medias = {
          title: group.title,
          data: group.items?.map((item: any) => ({
            title: item.title,
            type: item.type || 'Media',
            url: item.url || '',
            image: item.image ? { src: item.image, alt: item.title } : { src: '', alt: item.title },
          })) || [],
        };
        break;
    }
  });

  return result;
}

/**
 * Helper function to load and convert about.md data
 */
export async function loadAboutMdData(locale: 'en' | 'ru'): Promise<Data> {
  try {
    // Try to load from the new about.md structure
    const aboutMdPath = `@/content/aboutPage/${locale}/about.md`;
    const aboutMdModule = await import(/* @vite-ignore */ aboutMdPath);
    const aboutMdData = aboutMdModule.frontmatter;
    
    if (aboutMdData && aboutMdData.sections) {
      return convertAboutMdToDevscardData(aboutMdData);
    }
  } catch (error) {
    console.warn(`Failed to load about.md for locale ${locale}, falling back to TypeScript data:`, error);
  }
  
  // Fallback to existing TypeScript data
  const { getDevscardData } = await import('./getDevscardData');
  return getDevscardData(locale);
}

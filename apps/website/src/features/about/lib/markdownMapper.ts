import type { MarkdownSection, MainMarkdownSection, SkillsMarkdownSection, ExperienceMarkdownSection, EducationMarkdownSection, FavoritesMarkdownSection, BrandsMarkdownSection } from '../types/markdown.types';

// Stock image fallback URLs
const FALLBACK_IMAGES = {
  // Main section - portrait style
  main: 'https://images.unsplash.com/photo-1531123414780-f742d3f0540c?w=160&h=240&fit=crop&crop=faces',
  
  // Experience section - generic company/brand
  experience: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=256&h=256&fit=crop&crop=faces',
  
  // Education section - campus/education
  education: 'https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=256&h=256&fit=crop&crop=faces',
  
  // Favorites section - category-specific
  favorites: {
    hobbies: {
      'Technologies': 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=800',
      'Snowboarding': 'https://images.unsplash.com/photo-1516569422860-0b56a8a7e6cf?w=800',
      'Art': 'https://images.unsplash.com/photo-1465311440653-ba9b1d9b0f5b?w=800',
      'Stand-up Comedy': 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=800',
      'Cooking': 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800',
    },
    people: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=800&fit=crop&crop=faces',
    medias: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
    books: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0ea?w=800',
    movies: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=800',
  }
};

/**
 * Validates and maps Markdown sections to the expected About page format
 * with fallback images for missing logos/images
 */
export function fromMarkdownSections(sections: unknown[]): { [key: string]: any } {
  if (!Array.isArray(sections)) {
    console.warn('[markdownMapper] sections is not an array:', sections);
    return {};
  }

  const result: { [key: string]: any } = {};

  sections.forEach((section: any, index: number) => {
    if (!section || typeof section !== 'object' || !section.type || !section.data) {
      console.warn(`[markdownMapper] Invalid section at index ${index}:`, section);
      return;
    }

    const type = section.type.toLowerCase();
    const data = section.data;

    try {
      switch (type) {
        case 'main':
          result.main = mapMainSection(section as MainMarkdownSection);
          break;
        case 'skills':
          result.skills = mapSkillsSection(section as SkillsMarkdownSection);
          break;
        case 'experience':
          result.experience = mapExperienceSection(section as ExperienceMarkdownSection);
          break;
        case 'education':
          result.education = mapEducationSection(section as EducationMarkdownSection);
          break;
        case 'favorites':
          result.favorites = mapFavoritesSection(section as FavoritesMarkdownSection);
          break;
        case 'brands':
          result.brands = mapBrandsSection(section as BrandsMarkdownSection);
          break;
        default:
          console.warn(`[markdownMapper] Unknown section type: ${type}`);
      }
    } catch (error) {
      console.error(`[markdownMapper] Error mapping section ${type}:`, error);
    }
  });

  return result;
}

function mapMainSection(section: MainMarkdownSection) {
  const data = section.data;
  
  return {
    type: 'main',
    data: {
      title: data.title || 'Profile',
      slug: data.slug || 'profile',
      icon: data.icon || 'fa6-solid:user',
      visible: data.visible !== false,
      fullName: data.fullName || '',
      role: data.role || '',
      image: data.image || FALLBACK_IMAGES.main,
      description: data.description || '',
      details: Array.isArray(data.details) ? data.details : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      action: data.action || { label: 'Download CV', url: '#', downloadedFileName: 'CV.pdf' },
      links: Array.isArray(data.links) ? data.links : []
    }
  };
}

function mapSkillsSection(section: SkillsMarkdownSection) {
  const data = section.data;
  
  return {
    type: 'skills',
    data: {
      title: data.title || 'Skills',
      groups: Array.isArray(data.groups) ? data.groups.map(group => ({
        title: group.title || '',
        items: Array.isArray(group.items) ? group.items.map(item => ({
          name: item.name || '',
          icon: item.icon || 'simple-icons:default',
          level: item.level
        })) : []
      })) : []
    }
  };
}

function mapExperienceSection(section: ExperienceMarkdownSection) {
  const data = section.data;
  
  return {
    type: 'experience',
    data: {
      title: data.title || 'Experience',
      slug: data.slug || 'experience',
      icon: data.icon || 'fa6-solid:briefcase',
      visible: data.visible !== false,
      items: Array.isArray(data.items) ? data.items.map(company => ({
        company: company.company || '',
        location: company.location || '',
        logo: company.logo || FALLBACK_IMAGES.experience,
        website: company.website || '',
        roles: Array.isArray(company.roles) ? company.roles.map(role => ({
          title: role.title || '',
          period: role.period || '',
          bullets: Array.isArray(role.bullets) ? role.bullets : [],
          description: role.description || '',
          technologies: Array.isArray(role.technologies) ? role.technologies : [],
          links: Array.isArray(role.links) ? role.links : []
        })) : []
      })) : []
    }
  };
}

function mapEducationSection(section: EducationMarkdownSection) {
  const data = section.data;
  
  return {
    type: 'education',
    data: {
      title: data.title || 'Education',
      items: Array.isArray(data.items) ? data.items.map(institution => ({
        school: institution.school || '',
        location: institution.location || '',
        url: institution.url || '',
        logo: institution.logo || FALLBACK_IMAGES.education,
        degrees: Array.isArray(institution.degrees) ? institution.degrees.map(degree => ({
          degree: degree.degree || '',
          program: degree.program || '',
          faculty: degree.faculty || '',
          period: degree.period || '',
          bullets: Array.isArray(degree.bullets) ? degree.bullets : []
        })) : []
      })) : []
    }
  };
}

function mapFavoritesSection(section: FavoritesMarkdownSection) {
  const data = section.data;
  
  return {
    type: 'favorites',
    data: {
      title: data.title || 'Favorites',
      slug: data.slug || 'favorites',
      icon: data.icon || 'fa6-solid:star',
      visible: data.visible !== false,
      style: data.style || {
        variant: 'tile',
        cols: { base: 2, sm: 3, lg: 6 }
      },
      groups: Array.isArray(data.groups) ? data.groups.map(group => ({
        title: group.title || '',
        type: group.type || 'hobbies',
        style: group.style || { limit: 5 },
        items: Array.isArray(group.items) ? group.items.map(item => ({
          title: item.title || '',
          name: item.name,
          author: item.author,
          type: item.type,
          url: item.url || '#',
          icon: item.icon,
          image: getFavoritesFallbackImage(item.image, group.type, item.title)
        })) : []
      })) : []
    }
  };
}

function getFavoritesFallbackImage(providedImage: string | undefined, groupType: string, itemTitle: string): string {
  if (providedImage) {
    return providedImage;
  }

  const fallbacks = FALLBACK_IMAGES.favorites;
  
  switch (groupType) {
    case 'hobbies':
      // Check for specific hobby types
      const hobbyFallbacks = fallbacks.hobbies as any;
      if (itemTitle && hobbyFallbacks[itemTitle]) {
        return hobbyFallbacks[itemTitle];
      }
      return hobbyFallbacks['Technologies']; // Default hobby fallback
      
    case 'people':
      return fallbacks.people;
      
    case 'medias':
      return fallbacks.medias;
      
    case 'books':
      return fallbacks.books;
      
    case 'movies':
      return fallbacks.movies;
      
    default:
      return fallbacks.medias; // Generic fallback
  }
}

function mapBrandsSection(section: BrandsMarkdownSection) {
  const data = section.data;
  
  return {
    type: 'brands',
    data: {
      title: data.title || 'Brands & Projects',
      slug: data.slug || 'brands',
      icon: data.icon || 'fa6-solid:building',
      visible: data.visible !== false,
      items: Array.isArray(data.items) ? data.items.map(item => ({
        name: item.name || '',
        img: item.img || '',
        url: item.url || ''
      })) : []
    }
  };
}

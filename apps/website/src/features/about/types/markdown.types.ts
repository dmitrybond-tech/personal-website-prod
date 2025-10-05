// TypeScript interfaces for About page Markdown frontmatter structure

export interface MarkdownFrontmatter {
  title: string;
  slug: string;
  sections: MarkdownSection[];
  lineWidth?: number;
}

export type MarkdownSection = 
  | MainMarkdownSection
  | SkillsMarkdownSection
  | ExperienceMarkdownSection
  | EducationMarkdownSection
  | FavoritesMarkdownSection;

// Base section interface
export interface BaseMarkdownSection {
  type: string;
  data: any;
}

// Main section (Profile)
export interface MainMarkdownSection extends BaseMarkdownSection {
  type: 'main';
  data: {
    title: string;
    slug: string;
    icon: string;
    visible: boolean;
    fullName: string;
    role: string;
    image: string;
    description: string;
    details: Array<{
      label: string;
      value: string;
      url?: string;
    }>;
    tags: Array<{
      name: string;
    }>;
    action: {
      label: string;
      url: string;
      downloadedFileName: string;
    };
    links: Array<{
      label: string;
      url: string;
      icon: string;
      color: string;
    }>;
  };
}

// Skills section
export interface SkillsMarkdownSection extends BaseMarkdownSection {
  type: 'skills';
  data: {
    title: string;
    groups: Array<{
      title: string;
      items: Array<{
        name: string;
        icon: string;
        level?: number;
      }>;
    }>;
  };
}

// Experience section
export interface ExperienceMarkdownSection extends BaseMarkdownSection {
  type: 'experience';
  data: {
    title: string;
    slug: string;
    icon: string;
    visible: boolean;
    items: Array<{
      company: string;
      location: string;
      logo: string;
      website: string;
      roles: Array<{
        title: string;
        period: string;
        bullets: string[];
        description: string;
        technologies: string[];
        links: Array<{
          label: string;
          url: string;
        }>;
      }>;
    }>;
  };
}

// Education section
export interface EducationMarkdownSection extends BaseMarkdownSection {
  type: 'education';
  data: {
    title: string;
    items: Array<{
      school: string;
      location: string;
      url: string;
      logo: string;
      degrees: Array<{
        degree: string;
        program: string;
        faculty: string;
        period: string;
        bullets: string[];
      }>;
    }>;
  };
}

// Favorites section
export interface FavoritesMarkdownSection extends BaseMarkdownSection {
  type: 'favorites';
  data: {
    title: string;
    slug: string;
    icon: string;
    visible: boolean;
    style: {
      variant: string;
      cols: {
        base: number;
        sm: number;
        lg: number;
      };
    };
    groups: Array<{
      title: string;
      type: 'hobbies' | 'people' | 'medias' | 'books' | 'movies';
      style: {
        limit: number;
      };
      items: Array<{
        title: string;
        name?: string;
        author?: string;
        type?: string;
        url: string;
        icon?: string;
        image?: string;
      }>;
    }>;
  };
}

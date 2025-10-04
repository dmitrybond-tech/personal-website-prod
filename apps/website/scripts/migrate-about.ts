#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Types for the migration
interface OldSection {
  type: string;
  data: any;
}

interface OldAboutData {
  title: string;
  slug: string;
  cv_pdf?: string;
  sections: OldSection[];
}

interface NewDetail {
  label: string;
  value: string;
  url?: string;
}

interface NewTag {
  name: string;
}

interface NewAction {
  label: string;
  url: string;
  downloadedFileName: string;
}

interface NewLink {
  label: string;
  url: string;
  icon: string;
  color?: string;
}

interface NewMainSection {
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
    details: NewDetail[];
    tags: NewTag[];
    action: NewAction;
    links: NewLink[];
  };
}

interface NewSkill {
  name: string;
  level: string;
  icon: string;
  color?: string;
  description?: string;
}

interface NewSkillCategory {
  title: string;
  skills: NewSkill[];
}

interface NewSkillsSection {
  type: 'skills';
  data: {
    title: string;
    slug: string;
    icon: string;
    visible: boolean;
    categories: NewSkillCategory[];
  };
}

interface NewExperienceSection {
  type: 'experience';
  data: {
    title: string;
    slug: string;
    icon: string;
    visible: boolean;
    items: any[];
  };
}

interface NewEducationSection {
  type: 'education';
  data: {
    title: string;
    slug: string;
    icon: string;
    visible: boolean;
    items: any[];
  };
}

interface NewFavoritesGroup {
  title: string;
  type: string;
  style: {
    limit: number;
  };
  items: any[];
}

interface NewFavoritesSection {
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
    groups: NewFavoritesGroup[];
  };
}

type NewSection = NewMainSection | NewSkillsSection | NewExperienceSection | NewEducationSection | NewFavoritesSection;

interface NewAboutData {
  title: string;
  slug: string;
  sections: NewSection[];
}

// Helper functions
const pickDetail = (details: NewDetail[], labels: string[]): NewDetail | undefined => {
  return details.find(d => labels.includes(d.label));
};

const mapLevel = (level: number | string): string => {
  if (typeof level === 'number') {
    if (level <= 2) return 'beginner';
    if (level === 3) return 'intermediate';
    if (level >= 4) return 'advanced';
    return 'beginner';
  }
  
  const levelStr = level.toString().toLowerCase();
  if (levelStr.includes('native') || levelStr.includes('c1') || levelStr.includes('c2')) {
    return 'expert';
  }
  if (levelStr.includes('b2')) return 'intermediate';
  if (levelStr.includes('b1')) return 'beginner';
  
  return 'intermediate';
};

const mapGroupType = (title: string, lang: 'en' | 'ru'): string => {
  const titleLower = title.toLowerCase();
  
  if (lang === 'en') {
    if (titleLower.includes('hobbi')) return 'hobbies';
    if (titleLower.includes('people')) return 'people';
    if (titleLower.includes('media')) return 'medias';
    if (titleLower.includes('book')) return 'books';
    if (titleLower.includes('movie')) return 'movies';
  } else {
    if (titleLower.includes('хобби')) return 'hobbies';
    if (titleLower.includes('люди')) return 'people';
    if (titleLower.includes('медиа')) return 'medias';
    if (titleLower.includes('книги')) return 'books';
    if (titleLower.includes('фильм')) return 'movies';
  }
  
  return 'hobbies'; // default fallback
};

const mergeExpandedPriority = (expanded: NewAboutData | null, generated: NewAboutData): NewAboutData => {
  if (!expanded) return generated;
  
  // Deep merge with priority to expanded values
  const result: NewAboutData = {
    title: expanded.title || generated.title,
    slug: expanded.slug || generated.slug,
    sections: []
  };
  
  // Merge sections by type
  const expandedSections = new Map(expanded.sections.map(s => [s.type, s]));
  const generatedSections = new Map(generated.sections.map(s => [s.type, s]));
  
  // Add all section types
  const allTypes = new Set([...expandedSections.keys(), ...generatedSections.keys()]);
  
  for (const type of allTypes) {
    const expandedSection = expandedSections.get(type);
    const generatedSection = generatedSections.get(type);
    
    if (expandedSection) {
      result.sections.push(expandedSection);
    } else if (generatedSection) {
      result.sections.push(generatedSection);
    }
  }
  
  return result;
};

// Migration functions
const migrateHeroToMain = (heroSection: any, cvPdf: string | undefined, lang: 'en' | 'ru'): NewMainSection => {
  const data = heroSection.data || {};
  
  // Build details array
  const details: NewDetail[] = [];
  
  if (data.location) {
    details.push({
      label: lang === 'ru' ? 'Местоположение' : 'Location',
      value: data.location
    });
  }
  
  if (data.contact?.email) {
    details.push({
      label: 'Email',
      value: data.contact.email,
      url: `mailto:${data.contact.email}`
    });
  }
  
  if (data.contact?.phone) {
    details.push({
      label: lang === 'ru' ? 'Телефон' : 'Phone',
      value: data.contact.phone,
      url: `tel:${data.contact.phone}`
    });
  }
  
  if (data.role) {
    details.push({
      label: lang === 'ru' ? 'Должность' : 'Role',
      value: data.role
    });
  }
  
  // Convert tags from strings to objects
  const tags: NewTag[] = (data.tags || []).map((tag: string) => ({ name: tag }));
  
  // Build action from cv_pdf
  const action: NewAction = {
    label: lang === 'ru' ? 'Скачать резюме' : 'Download CV',
    url: cvPdf || 'https://example.com/cv.pdf',
    downloadedFileName: lang === 'ru' ? 'CV-Дмитрий_Бондаренко.pdf' : 'CV-Dmitry_Bondarenko.pdf'
  };
  
  // Convert links
  const links: NewLink[] = (data.links || []).map((link: any) => ({
    label: link.label,
    url: link.url,
    icon: link.icon,
    color: link.color
  }));
  
  return {
    type: 'main',
    data: {
      title: lang === 'ru' ? 'Профиль' : 'Profile',
      slug: 'profile',
      icon: 'fa6-solid:user',
      visible: true,
      fullName: data.name || '',
      role: data.role || '',
      image: data.avatar || '',
      description: data.bio || '',
      details,
      tags,
      action,
      links
    }
  };
};

const migrateSkills = (skillsSection: any, lang: 'en' | 'ru'): NewSkillsSection => {
  const data = skillsSection.data || {};
  const groups = data.groups || [];
  
  const categories: NewSkillCategory[] = groups.map((group: any) => ({
    title: group.title,
    skills: (group.items || []).map((item: any) => ({
      name: item.name,
      level: mapLevel(item.level),
      icon: item.icon,
      color: item.color,
      description: item.description
    }))
  }));
  
  return {
    type: 'skills',
    data: {
      title: data.title || (lang === 'ru' ? 'Навыки' : 'Skills'),
      slug: 'skills',
      icon: 'fa6-solid:bars-progress',
      visible: true,
      categories
    }
  };
};

const migrateExperience = (experienceSection: any, lang: 'en' | 'ru'): NewExperienceSection => {
  const data = experienceSection.data || {};
  
  const items = (data.items || []).map((item: any) => ({
    ...item,
    website: item.url || item.website // Map url to website
  }));
  
  return {
    type: 'experience',
    data: {
      title: data.title || (lang === 'ru' ? 'Опыт' : 'Experience'),
      slug: 'experience',
      icon: 'fa6-solid:briefcase',
      visible: true,
      items
    }
  };
};

const migrateEducation = (educationSection: any, lang: 'en' | 'ru'): NewEducationSection => {
  const data = educationSection.data || {};
  
  return {
    type: 'education',
    data: {
      title: data.title || (lang === 'ru' ? 'Образование' : 'Education'),
      slug: 'education',
      icon: 'fa6-solid:graduation-cap',
      visible: true,
      items: data.items || []
    }
  };
};

const migrateFavorites = (favoritesSection: any, lang: 'en' | 'ru'): NewFavoritesSection => {
  const data = favoritesSection.data || {};
  const groups = data.groups || [];
  
  const newGroups: NewFavoritesGroup[] = groups.map((group: any) => ({
    title: group.title,
    type: mapGroupType(group.title, lang),
    style: {
      limit: group.style?.limit || 5
    },
    items: (group.items || []).map((item: any) => ({
      ...item,
      // Add missing fields if needed
      image: item.image,
      author: item.author,
      name: item.name,
      type: item.type
    }))
  }));
  
  return {
    type: 'favorites',
    data: {
      title: data.title || (lang === 'ru' ? 'Избранное' : 'Favorites'),
      slug: 'favorites',
      icon: 'fa6-solid:star',
      visible: true,
      style: {
        variant: 'tile',
        cols: {
          base: 2,
          sm: 3,
          lg: 6
        }
      },
      groups: newGroups
    }
  };
};

const migrateAboutFile = async (lang: 'en' | 'ru'): Promise<void> => {
  const oldPath = path.join(process.cwd(), 'src', 'content', 'aboutPage', lang, 'about.md');
  const newPath = path.join(process.cwd(), 'src', 'content', 'aboutPage', lang, 'about-expanded.md');
  
  console.log(`\n🔄 Migrating ${lang}/about.md to ${lang}/about-expanded.md`);
  
  // Read existing about-expanded.md if it exists
  let existingExpanded: NewAboutData | null = null;
  if (fs.existsSync(newPath)) {
    try {
      const content = fs.readFileSync(newPath, 'utf-8');
      const frontmatter = content.split('---')[1];
      existingExpanded = yaml.load(frontmatter) as NewAboutData;
      console.log(`📖 Found existing about-expanded.md, will merge with priority`);
    } catch (error) {
      console.log(`⚠️  Could not parse existing about-expanded.md: ${error}`);
    }
  }
  
  // Read old about.md
  let oldData: OldAboutData | null = null;
  if (fs.existsSync(oldPath)) {
    try {
      const content = fs.readFileSync(oldPath, 'utf-8');
      const frontmatter = content.split('---')[1];
      oldData = yaml.load(frontmatter) as OldAboutData;
      console.log(`📖 Read old about.md with ${oldData.sections.length} sections`);
    } catch (error) {
      console.log(`❌ Could not read old about.md: ${error}`);
      return;
    }
  }
  
  if (!oldData) {
    console.log(`⚠️  No old about.md found, creating minimal structure`);
    // Create minimal structure
    const minimalData: NewAboutData = {
      title: lang === 'ru' ? 'Обо мне' : 'About',
      slug: `${lang}/about`,
      sections: []
    };
    
    // Write minimal structure
    const yamlContent = yaml.dump(minimalData, {
      lineWidth: -1,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false
    });
    
    const content = `---\n${yamlContent}---\n`;
    fs.writeFileSync(newPath, content, 'utf-8');
    console.log(`✅ Created minimal about-expanded.md`);
    return;
  }
  
  // Migrate sections
  const newSections: NewSection[] = [];
  
  for (const section of oldData.sections) {
    switch (section.type) {
      case 'hero':
        newSections.push(migrateHeroToMain(section, oldData.cv_pdf, lang));
        break;
      case 'skills':
        newSections.push(migrateSkills(section, lang));
        break;
      case 'experience':
        newSections.push(migrateExperience(section, lang));
        break;
      case 'education':
        newSections.push(migrateEducation(section, lang));
        break;
      case 'favorites':
        newSections.push(migrateFavorites(section, lang));
        break;
      default:
        console.log(`⚠️  Unknown section type: ${section.type}`);
    }
  }
  
  // Build new data structure
  const newData: NewAboutData = {
    title: oldData.title,
    slug: oldData.slug,
    sections: newSections
  };
  
  // Merge with existing expanded data
  const finalData = mergeExpandedPriority(existingExpanded, newData);
  
  // Write to file
  const yamlContent = yaml.dump(finalData, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false
  });
  
  const content = `---\n${yamlContent}---\n`;
  fs.writeFileSync(newPath, content, 'utf-8');
  
  console.log(`✅ Migrated ${lang}/about.md -> ${lang}/about-expanded.md`);
  console.log(`📊 Sections: ${finalData.sections.map(s => s.type).join(', ')}`);
  
  // Summary
  const mainSection = finalData.sections.find(s => s.type === 'main') as NewMainSection;
  if (mainSection) {
    console.log(`👤 Profile: ${mainSection.data.fullName} - ${mainSection.data.role}`);
    console.log(`📧 Details: ${mainSection.data.details.length} items`);
    console.log(`🏷️  Tags: ${mainSection.data.tags.length} tags`);
    console.log(`🔗 Links: ${mainSection.data.links.length} links`);
  }
};

// Main execution
const main = async () => {
  console.log('🚀 Starting about.md migration to about-expanded.md');
  
  try {
    await migrateAboutFile('en');
    await migrateAboutFile('ru');
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Review the generated about-expanded.md files');
    console.log('2. Update any missing data manually if needed');
    console.log('3. Test the about pages to ensure they render correctly');
    console.log('4. Update Decap CMS config if needed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { migrateAboutFile, mapLevel, mapGroupType };

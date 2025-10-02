import { getCollection, getEntry } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface AboutModel {
  title: string;
  lead?: string;
  sections?: Array<{
    icon?: string;
    heading?: string;
    body?: string;
    image?: string;
  }>;
  links?: Array<{
    label: string;
    url: string;
    icon?: string;
  }>;
  cv_pdf?: string;
  gallery?: string[];
}

/**
 * Loads About page content with fallback mechanism:
 * 1. Try to load from Astro Content Collections
 * 2. Fallback to reference data from website-vanilla_ref
 * 3. Fallback to English if Russian is missing
 */
export async function getAbout(lang: 'en' | 'ru'): Promise<AboutModel> {
  try {
    // Try to load from Content Collections first
    const aboutPage = await getEntry('aboutPage', `${lang}/about`);
    
    if (aboutPage) {
      return {
        title: aboutPage.data.title,
        lead: aboutPage.data.lead,
        sections: aboutPage.data.sections?.map(section => ({
          ...section,
          image: section.image?.src || section.image,
        })),
        links: aboutPage.data.links,
        cv_pdf: aboutPage.data.cv_pdf,
        gallery: aboutPage.data.gallery?.map(img => img.src || img),
      };
    }
  } catch (error) {
    console.warn(`Failed to load About page from Content Collections for ${lang}:`, error);
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
    title: lang === 'ru' ? 'Обо мне' : 'About me',
    lead: lang === 'ru' ? 'Информация о разработчике' : 'Developer information',
  };
}

/**
 * Loads reference data from website-vanilla_ref
 */
function loadReferenceData(lang: 'en' | 'ru'): AboutModel | null {
  try {
    // Try to load from the reference folder structure
    const referencePath = join(process.cwd(), '..', 'website-vanilla_ref', 'src', 'features', 'about', 'devscard', 'locales', lang);
    
    // Load main section data
    const mainSectionPath = join(referencePath, 'main-section.data.ts');
    const mainSectionContent = readFileSync(mainSectionPath, 'utf-8');
    
    // Extract data from the TypeScript file (simple parsing)
    const titleMatch = mainSectionContent.match(/fullName:\s*['"`]([^'"`]+)['"`]/);
    const roleMatch = mainSectionContent.match(/role:\s*['"`]([^'"`]+)['"`]/);
    const descriptionMatch = mainSectionContent.match(/description:\s*['"`]([^'"`]+)['"`]/);
    const cvUrlMatch = mainSectionContent.match(/url:\s*['"`]([^'"`]+)['"`]/);
    
    const title = titleMatch?.[1] || (lang === 'ru' ? 'Обо мне' : 'About me');
    const role = roleMatch?.[1] || '';
    const description = descriptionMatch?.[1] || '';
    const cvPdf = cvUrlMatch?.[1] || '';
    
    return {
      title,
      lead: description,
      sections: [
        {
          heading: role,
          body: description,
        }
      ],
      cv_pdf: cvPdf,
    };
  } catch (error) {
    console.warn(`Failed to load reference data for ${lang}:`, error);
    return null;
  }
}

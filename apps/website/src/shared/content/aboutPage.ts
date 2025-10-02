import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type AboutPageModel = CollectionEntry<'aboutPage'>;

/**
 * Gets about page data for a specific locale
 */
export async function getAboutPage(locale: 'en' | 'ru'): Promise<AboutPageModel | null> {
  try {
    const aboutPages = await getCollection('aboutPage');
    const aboutPage = aboutPages.find(page => 
      page.slug === locale || page.slug === `${locale}/about`
    );
    
    return aboutPage || null;
  } catch (error) {
    console.warn(`Failed to get about page for locale ${locale}:`, error);
    return null;
  }
}

/**
 * Gets all about page data
 */
export async function getAllAboutPages(): Promise<AboutPageModel[]> {
  try {
    return await getCollection('aboutPage');
  } catch (error) {
    console.warn('Failed to get about pages:', error);
    return [];
  }
}

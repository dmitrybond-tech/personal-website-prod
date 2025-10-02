import type { ReadonlyDeep } from 'type-fest';

export interface AboutBlock {
  type: 'heading' | 'text' | 'items';
  text?: string;
  md?: string;
  items?: Array<{ label: string; value: string }>;
}

export interface BookMeEvent {
  id: string;
  label: string;
  link: string;
}

export interface AboutPageData {
  route: string;
  lang: string;
  title: string;
  blocks: AboutBlock[];
}

export interface BookMePageData {
  route: string;
  lang: string;
  title: string;
  intro?: string;
  events: BookMeEvent[];
}

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterLegal {
  privacyUrl: string;
  termsUrl: string;
  cookiesUrl: string;
}

export interface FooterConsent {
  bannerText: string;
  acceptLabel: string;
  manageLabel: string;
}

export interface FooterData {
  brandLine: string;
  links: FooterLink[];
  legal: FooterLegal;
  consent: FooterConsent;
}

export type PageData = AboutPageData | BookMePageData;

/**
 * Reads CMS page data from JSON files with fallback to null
 */
export async function readPage(lang: 'en' | 'ru', slug: 'about' | 'bookme'): Promise<PageData | null> {
  try {
    // Use Vite's import.meta.glob to dynamically import JSON files
    const modules = import.meta.glob('../../../../content/pages/**/index.json', { 
      eager: true,
      import: 'default'
    });
    
    const filePath = `../../../../content/pages/${slug}/${lang}/index.json`;
    const module = modules[filePath] as any;
    
    if (module && typeof module === 'object') {
      return module as PageData;
    }
    
    return null;
  } catch (error) {
    console.warn(`[CMS] Failed to load page data for ${lang}/${slug}:`, error);
    return null;
  }
}

/**
 * Reads About page data specifically
 */
export async function readAboutPage(lang: 'en' | 'ru'): Promise<AboutPageData | null> {
  const data = await readPage(lang, 'about');
  return data as AboutPageData | null;
}

/**
 * Reads BookMe page data specifically
 */
export async function readBookMePage(lang: 'en' | 'ru'): Promise<BookMePageData | null> {
  const data = await readPage(lang, 'bookme');
  return data as BookMePageData | null;
}

/**
 * Checks if CMS data is available for a page
 */
export async function hasCmsData(lang: 'en' | 'ru', slug: 'about' | 'bookme'): Promise<boolean> {
  const data = await readPage(lang, slug);
  return data !== null;
}

/**
 * Reads footer data from CMS JSON files with fallback to null
 */
export async function readFooter(lang: 'en' | 'ru'): Promise<FooterData | null> {
  try {
    // Use Vite's import.meta.glob to dynamically import JSON files
    const modules = import.meta.glob('../../../../content/footer/**/index.json', { 
      eager: true,
      import: 'default'
    });
    
    const filePath = `../../../../content/footer/${lang}/index.json`;
    const module = modules[filePath] as any;
    
    if (module && typeof module === 'object') {
      return module as FooterData;
    }
    
    return null;
  } catch (error) {
    console.warn(`[CMS] Failed to load footer data for ${lang}:`, error);
    return null;
  }
}

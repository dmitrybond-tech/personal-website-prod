/**
 * Locale configuration and utilities
 */

export const LOCALES = ['en', 'ru'] as const;

export type Locale = typeof LOCALES[number];

/**
 * Type guard to check if a string is a valid locale
 */
export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

/**
 * Get locale from pathname
 */
export function getLocaleFromPath(pathname: string): Locale {
  if (pathname.startsWith('/ru')) {
    return 'ru';
  }
  return 'en';
}

/**
 * Get the other locale (for language switching)
 */
export function getOtherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'ru' : 'en';
}

/**
 * Get localized path for a given route
 */
export function getLocalizedPath(path: string, locale: Locale): string {
  // Remove existing locale prefix if present
  const cleanPath = path.replace(/^\/(en|ru)/, '');
  
  if (locale === 'en') {
    return cleanPath === '' ? '/' : `/${cleanPath}`;
  }
  
  return `/ru${cleanPath}`;
}

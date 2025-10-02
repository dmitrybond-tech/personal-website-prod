/**
 * Language switcher utility for Astro i18n routing
 * Maps current page to target locale with sensible fallbacks
 */

export type Locale = 'en' | 'ru';

/**
 * Switches the current path to the target locale
 * @param path - The current URL path
 * @param target - The target locale
 * @returns The new path with the target locale prefix
 */
export function switchLocaleHref(path: string, target: 'en' | 'ru'): string {
  const m = path.match(/^\/(en|ru)(\/.*)?$/);
  const rest = m?.[2] ?? '/about';

  if (/^\/blog\/[^/]+/.test(rest)) return `/${target}/blog`;
  if (rest === '/' || rest === '') return `/${target}/about`;

  return `/${target}${rest}`.replace(/\/{2,}/g, '/');
}

/**
 * Gets the current locale from a path
 * @param path - The URL path
 * @returns The current locale or null if not found
 */
export function getCurrentLocale(path: string): Locale | null {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  if (cleanPath.startsWith('en/') || cleanPath === 'en') {
    return 'en';
  } else if (cleanPath.startsWith('ru/') || cleanPath === 'ru') {
    return 'ru';
  }
  
  return null;
}

/**
 * Gets the opposite locale
 * @param current - The current locale
 * @returns The opposite locale
 */
export function getOppositeLocale(current: Locale): Locale {
  return current === 'en' ? 'ru' : 'en';
}

/**
 * Gets the locale display name
 * @param locale - The locale
 * @returns The display name
 */
export function getLocaleDisplayName(locale: Locale): string {
  return locale === 'en' ? 'English' : 'Русский';
}

/**
 * Gets the locale flag emoji
 * @param locale - The locale
 * @returns The flag emoji
 */
export function getLocaleFlag(locale: Locale): string {
  return locale === 'en' ? '🇺🇸' : '🇷🇺';
}

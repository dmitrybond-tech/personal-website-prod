export type Locale = 'en' | 'ru';

export const LOCALE_ALIASES = {
  en: 'en',
  ru: 'ru',
} as const;

export const SUPPORTED_LOCALES: Locale[] = ['en', 'ru'];

export function getLocaleFromPath(pathname: string): Locale {
  if (pathname.startsWith('/ru')) return 'ru';
  return 'en';
}

export function swapLocale(pathname: string): string {
  const locale = getLocaleFromPath(pathname);
  const targetLocale = locale === 'en' ? 'ru' : 'en';
  
  // Заменяем префикс локали
  const pathWithoutLocale = pathname.replace(/^\/(en|ru)/, '');
  const newPath = `/${targetLocale}${pathWithoutLocale || '/about'}`;
  
  return newPath;
}

export function switchLocale(url: URL, target: Locale): string {
  const rest = url.pathname.replace(/^\/(en|ru)/, '') || '/about';
  return `/${target}${rest}${url.search}${url.hash}`;
}

export function getLocaleFromUrl(url: URL): Locale {
  return getLocaleFromPath(url.pathname);
}

export function localePath(locale: 'en'|'ru', path: string): string {
  return `/${locale}${path}`;
}

export function swapLocalePath(currentPath: string): string {
  // меняем только префикс /en|/ru, остальной путь сохраняем
  const pathWithoutLocale = currentPath.replace(/^\/(en|ru)/, '');
  const currentLocale = getLocaleFromPath(currentPath);
  const targetLocale = currentLocale === 'en' ? 'ru' : 'en';
  return `/${targetLocale}${pathWithoutLocale}`;
}
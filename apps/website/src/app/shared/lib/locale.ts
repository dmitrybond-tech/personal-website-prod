export type Locale = 'en' | 'ru';

export function getLocaleFromPath(pathname: string): Locale {
  return pathname.startsWith('/ru') ? 'ru' : 'en';
}

export function switchLocale(url: URL, target: Locale): string {
  const rest = url.pathname.replace(/^\/(en|ru)/, '') || '/about';
  return `/${target}${rest}${url.search}${url.hash}`;
}
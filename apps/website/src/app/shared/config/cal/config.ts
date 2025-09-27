// apps/website/src/app/shared/config/cal/config.ts
export type CalLocale = 'en' | 'ru';
export type BookingType = 'interview' | 'tech' | 'mentoring';

export interface CalEmbedConfig {
  origin: string; // Cal.com origin
  defaultLocale: CalLocale;
  // Языковая карта для Cal UI (если Cal принимает "language" или "locale")
  localeMap: Record<CalLocale, string>;
  // Ссылки на разные типы встреч по локали
  linksByType: Record<BookingType, Record<CalLocale, string>>;
  ui: {
    layout: 'month_view' | 'week_view' | 'column_view';
    hideEventTypeDetails: boolean;
    branding?: { brandColor?: string };
    themeSync?: boolean;   // брать --brand-color из :root
    forceLanguage?: boolean; // если true — всегда пробрасывать language в Cal UI
  };
  behavior: {
    selector: string;   // '.calendar-placeholder'
    lazy: boolean;      // ленивое монтирование
    threshold: number;  // 0..1 для IntersectionObserver
    scrollIntoViewOnSelect: boolean; // прокрутка к календарю при выборе тайла
  };
}

export const calEmbedConfig: CalEmbedConfig = {
  origin: 'https://cal.com',
  defaultLocale: 'en',
  localeMap: {
    en: 'en',
    ru: 'ru',
  },
  linksByType: {
    // TODO: замените плейсхолдеры на реальные calLink'и (username/event-type)
    interview: { en: 'YOUR_EN_30M_LINK', ru: 'YOUR_RU_30M_LINK' },
    tech:      { en: 'YOUR_EN_90M_LINK', ru: 'YOUR_RU_90M_LINK' },
    mentoring: { en: 'YOUR_EN_60M_LINK', ru: 'YOUR_RU_60M_LINK' },
  },
  ui: {
    layout: 'month_view',
    hideEventTypeDetails: false,
    branding: { brandColor: '#0ea5e9' },
    themeSync: true,
    forceLanguage: true,
  },
  behavior: {
    selector: '.calendar-placeholder',
    lazy: true,
    threshold: 0.15,
    scrollIntoViewOnSelect: true,
  },
};

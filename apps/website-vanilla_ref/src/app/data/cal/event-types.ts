export type CalEventType = {
  id: string;                    // стабильный ID для DOM
  calLink: string;               // "username/event-slug" (НЕ URL!)
  durationMin: number;           // 15, 30, 45 ...
  i18n: {
    en: { title: string; subtitle?: string; cta?: string; },
    ru: { title: string; subtitle?: string; cta?: string; },
  };
};

export const CAL_EVENT_TYPES: CalEventType[] = [
  {
    id: 'intro-30',
    calLink: 'dmitrybond/intro-30m',  // TODO: не менять формат
    durationMin: 30,
    i18n: {
      en: { title: 'Intro call', subtitle: '30 min', cta: 'Book' },
      ru: { title: 'Знакомство', subtitle: '30 минут', cta: 'Записаться' },
    },
  },
  {
    id: 'tech-consultation',
    calLink: 'dmitrybond/tech-90m',
    durationMin: 90,
    i18n: {
      en: { title: 'Technical Consultation', subtitle: '90 min', cta: 'Book' },
      ru: { title: 'Техническая консультация', subtitle: '90 минут', cta: 'Записаться' },
    },
  },
  {
    id: 'mentoring',
    calLink: 'dmitrybond/mentoring-60m',
    durationMin: 60,
    i18n: {
      en: { title: 'Mentoring', subtitle: '60 min', cta: 'Book' },
      ru: { title: 'Менторинг', subtitle: '60 минут', cta: 'Записаться' },
    },
  },
];

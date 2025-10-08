export const siteConfig = {
  name: "Dmitry Bondarenko",
  description: "Kinda generalist, I would say",
  theme_color: "#ffffff",
  background_color: "#ffffff"
} as const;

// Локализованные метаданные
export const localizedConfig = {
  en: {
    name: "Dmitry Bondarenko",
    description: "Kinda generalist, I would say"
  },
  ru: {
    name: "Дмитрий Бондаренко", 
    description: "И жрец, и жнец"
  }
} as const;

export function getSiteMetadata(locale: 'en' | 'ru' = 'en') {
  return {
    ...siteConfig,
    ...localizedConfig[locale]
  };
}

import type { FooterData, FooterLink, FooterLegal, FooterConsent } from './cmsLoader';

export interface FooterUILink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterUILegal {
  privacyUrl: string;
  termsUrl: string;
  cookiesUrl: string;
}

export interface FooterUIConsent {
  bannerText: string;
  acceptLabel: string;
  manageLabel: string;
}

export interface FooterUIProps {
  brandLine: string;
  links: FooterUILink[];
  legal: FooterUILegal;
  consent?: FooterUIConsent;
}

/**
 * Default fallback footer data for EN locale
 */
const DEFAULT_EN_FOOTER: FooterUIProps = {
  brandLine: "© 2024 Dima Bond. All rights reserved.",
  links: [
    { label: "Privacy Policy", href: "/en/privacy", external: false },
    { label: "Terms of Service", href: "/en/terms", external: false },
    { label: "Cookie Policy", href: "/en/cookies", external: false }
  ],
  legal: {
    privacyUrl: "/en/privacy",
    termsUrl: "/en/terms",
    cookiesUrl: "/en/cookies"
  },
  consent: {
    bannerText: "This site uses cookies. By continuing to browse, you agree to the terms described in the Privacy and Cookie Policies.",
    acceptLabel: "Accept",
    manageLabel: "Manage"
  }
};

/**
 * Default fallback footer data for RU locale
 */
const DEFAULT_RU_FOOTER: FooterUIProps = {
  brandLine: "© 2024 Дима Бонд. Все права защищены.",
  links: [
    { label: "Политика конфиденциальности", href: "/ru/politika-konfidentsialnosti", external: false },
    { label: "Условия использования", href: "/ru/terms", external: false },
    { label: "Политика cookies", href: "/ru/cookies", external: false }
  ],
  legal: {
    privacyUrl: "/ru/politika-konfidentsialnosti",
    termsUrl: "/ru/terms",
    cookiesUrl: "/ru/cookies"
  },
  consent: {
    bannerText: "Этот сайт использует файлы cookies. Продолжая пользоваться сайтом, вы соглашаетесь с условиями, описанными в Политике конфиденциальности.",
    acceptLabel: "Принять",
    manageLabel: "Управление"
  }
};

/**
 * Maps CMS footer data to UI props with fallback to defaults
 */
export function mapFooterData(cmsData: FooterData | null, locale: 'en' | 'ru'): FooterUIProps {
  if (!cmsData) {
    return locale === 'ru' ? DEFAULT_RU_FOOTER : DEFAULT_EN_FOOTER;
  }

  // Map CMS data to UI props with safe defaults
  const links: FooterUILink[] = (cmsData.links || []).map(link => ({
    label: link.label || '',
    href: link.href || '#',
    external: link.external || false
  }));

  const legal: FooterUILegal = {
    privacyUrl: cmsData.legal?.privacyUrl || (locale === 'ru' ? '/ru/politika-konfidentsialnosti' : '/en/privacy'),
    termsUrl: cmsData.legal?.termsUrl || (locale === 'ru' ? '/ru/terms' : '/en/terms'),
    cookiesUrl: cmsData.legal?.cookiesUrl || (locale === 'ru' ? '/ru/cookies' : '/en/cookies')
  };

  const consent: FooterUIConsent | undefined = cmsData.consent ? {
    bannerText: cmsData.consent.bannerText || '',
    acceptLabel: cmsData.consent.acceptLabel || (locale === 'ru' ? 'Принять' : 'Accept'),
    manageLabel: cmsData.consent.manageLabel || (locale === 'ru' ? 'Управление' : 'Manage')
  } : undefined;

  return {
    brandLine: cmsData.brandLine || (locale === 'ru' ? DEFAULT_RU_FOOTER.brandLine : DEFAULT_EN_FOOTER.brandLine),
    links,
    legal,
    consent
  };
}

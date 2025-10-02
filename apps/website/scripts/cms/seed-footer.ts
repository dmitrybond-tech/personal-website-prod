#!/usr/bin/env tsx

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const CONTENT_DIR = join(process.cwd(), 'src', 'content', 'footer');

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterLegal {
  privacyUrl: string;
  termsUrl: string;
  cookiesUrl: string;
}

interface FooterConsent {
  bannerText: string;
  acceptLabel: string;
  manageLabel: string;
}

interface FooterData {
  brandLine: string;
  links: FooterLink[];
  legal: FooterLegal;
  consent: FooterConsent;
}

const EN_FOOTER: FooterData = {
  brandLine: "© 2024 Dima Bond. All rights reserved.",
  links: [
    {
      label: "Privacy Policy",
      href: "/en/privacy",
      external: false
    },
    {
      label: "Terms of Service",
      href: "/en/terms",
      external: false
    },
    {
      label: "Cookie Policy",
      href: "/en/cookies",
      external: false
    }
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

const RU_FOOTER: FooterData = {
  brandLine: "© 2024 Дима Бонд. Все права защищены.",
  links: [
    {
      label: "Политика конфиденциальности",
      href: "/ru/politika-konfidentsialnosti",
      external: false
    },
    {
      label: "Условия использования",
      href: "/ru/terms",
      external: false
    },
    {
      label: "Политика cookies",
      href: "/ru/cookies",
      external: false
    }
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

function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function writeFooterFile(locale: string, data: FooterData): void {
  const localeDir = join(CONTENT_DIR, locale);
  ensureDir(localeDir);
  
  const filePath = join(localeDir, 'footer.json');
  const content = JSON.stringify(data, null, 2);
  
  writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Created footer for ${locale}: ${filePath}`);
}

function main(): void {
  console.log('🌱 Seeding footer content...');
  
  try {
    ensureDir(CONTENT_DIR);
    
    writeFooterFile('en', EN_FOOTER);
    writeFooterFile('ru', RU_FOOTER);
    
    console.log('✅ Footer seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding footer content:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

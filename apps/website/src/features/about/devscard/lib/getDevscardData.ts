import type { Data } from '../types/data';
import configDataEn from '../locales/en/config.js';
import sectionsDataEn from '../locales/en/index.js';
import configDataRu from '../locales/ru/config.js';
import sectionsDataRu from '../locales/ru/index.js';

export function getDevscardData(locale: 'en' | 'ru'): Data {
  if (locale === 'ru') {
    return { config: configDataRu, sections: sectionsDataRu } as unknown as Data;
  }
  
  return { config: configDataEn, sections: sectionsDataEn } as unknown as Data;
}

export type { Data } from '../types/data';

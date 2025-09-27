import type { Config } from '@/types/data';
import { ru } from 'date-fns/locale';
import type { ReadonlyDeep } from 'type-fest';

const config = {
  i18n: {
    locale: ru,
    dateFormat: 'MMMM yyyy',
    translations: {
      now: 'сейчас',
    },
  },
  meta: {
    title: 'Марк Фриман - Старший React Разработчик',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sodales ac dui at vestibulum. In condimentum metus id dui tincidunt, in blandit mi vehicula.',
    faviconPath: '/src/assets/my-image.jpeg',
  },
  pdf: {
    footer:
      'Я даю согласие на обработку моих персональных данных, включенных в мое заявление, для целей процесса найма.',
  },
} as const satisfies ReadonlyDeep<Config>;

export default config;

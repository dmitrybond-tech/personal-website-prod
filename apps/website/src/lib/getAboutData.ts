import { getCollection } from 'astro:content';
import type { Data } from '../features/about/devscard/types/data';

export async function getAboutData(locale: 'en' | 'ru'): Promise<Data> {
  const aboutPages = await getCollection('aboutPage');
  const aboutPage = aboutPages.find(page => page.slug.includes(locale));
  
  if (!aboutPage) {
    throw new Error(`About page not found for locale: ${locale}`);
  }

  const { data } = aboutPage;
  
  // Преобразуем данные из about-expanded.md в формат Data
  const mainSection = data.sections.find(s => s.type === 'main')?.data;
  const skillsSection = data.sections.find(s => s.type === 'skills')?.data;
  const experienceSection = data.sections.find(s => s.type === 'experience')?.data;
  const educationSection = data.sections.find(s => s.type === 'education')?.data;
  const brandsSection = data.sections.find(s => s.type === 'brands')?.data;
  const favoritesSection = data.sections.find(s => s.type === 'favorites')?.data;

  return {
    config: {
      name: locale === 'en' ? 'Dmitry Bondarenko' : 'Дмитрий Бондаренко',
      title: locale === 'en' ? 'CV' : 'Резюме',
      description: locale === 'en' ? 'Technical Project Manager CV' : 'Резюме технического менеджера проектов',
    },
    sections: {
      main: {
        config: mainSection?.config || {},
        image: mainSection?.image || '/uploads/placeholders/avatar.png',
        fullName: mainSection?.fullName || '',
        role: mainSection?.role || '',
        details: mainSection?.details || [],
        description: mainSection?.description || '',
        tags: mainSection?.tags || [],
        action: mainSection?.action || {
          label: locale === 'en' ? 'Download CV' : 'Скачать резюме',
          url: locale === 'en' ? '/cv_en/bondarenko-dmitry-tpm-cv-en-2.pdf' : '/cv_ru/bondarenko-dmitry-tpm-cv-ru-2.pdf',
          downloadedFileName: locale === 'en' ? 'CV-Dmitry_Bondarenko_TPM_En.pdf' : 'CV-Дмитрий_Бондаренко_TPM_Ru.pdf',
        },
        links: mainSection?.links || [],
      },
      skills: skillsSection || { config: {}, groups: [] },
      experience: experienceSection || { config: {}, items: [] },
      education: educationSection || { config: {}, items: [] },
      portfolio: { config: {}, items: [] }, // Пустая секция, так как в about-expanded.md нет portfolio
      brands: brandsSection || { config: {}, items: [] },
      testimonials: { config: {}, items: [] }, // Пустая секция
      favorites: favoritesSection || { config: {}, groups: [] },
    }
  } as Data;
}

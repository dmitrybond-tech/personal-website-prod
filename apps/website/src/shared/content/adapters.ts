import type { AboutModel } from './about';
import type { MainSection } from '../../features/about/devscard/types/sections/main-section.types';

/**
 * Converts CMS about data to Devs Card main section format
 */
export function toDevscardMainSection(aboutData: AboutModel, locale: 'en' | 'ru'): MainSection {
  const fallbackData = locale === 'ru' ? {
    fullName: 'Дмитрий Б.',
    role: 'Senior Full-Stack разработчик',
    description: 'Опытный full-stack разработчик с экспертизой в современных веб-технологиях.',
    image: '/assets/my-image.jpeg',
    details: [
      { label: 'Телефон', value: '+7 (xxx) xxx-xx-xx', url: 'tel:+7xxxxxxxxx' },
      { label: 'Email', value: 'dmitry@example.com', url: 'mailto:dmitry@example.com' },
      { label: 'Местоположение', value: 'Удаленно' },
      { label: 'Ставка', value: '$50-80/час' },
    ],
    tags: [
      { name: 'Открыт для фриланса' },
      { name: 'Доступен для менторства' },
      { name: 'Работаю над побочными проектами' }
    ],
    action: {
      label: 'Скачать резюме',
      url: '/cv_ru/cv.pdf',
      downloadedFileName: 'CV-Дмитрий_Б.pdf',
    },
    links: [
      { 
        label: 'GitHub', 
        icon: 'fa6-brands:github', 
        url: 'https://github.com/dmitry',
        color: '#333'
      },
      { 
        label: 'LinkedIn', 
        icon: 'fa6-brands:linkedin', 
        url: 'https://linkedin.com/in/dmitry',
        color: '#0077b5'
      },
      { 
        label: 'Twitter', 
        icon: 'fa6-brands:twitter', 
        url: 'https://twitter.com/dmitry',
        color: '#1da1f2'
      },
      { 
        label: 'Email', 
        icon: 'fa6-solid:envelope', 
        url: 'mailto:dmitry@example.com',
        color: '#ea4335'
      }
    ],
  } : {
    fullName: 'Dmitry B.',
    role: 'Senior Full-Stack Developer',
    description: 'Experienced full-stack developer with expertise in modern web technologies.',
    image: '/assets/my-image.jpeg',
    details: [
      { label: 'Phone', value: '+7 (xxx) xxx-xx-xx', url: 'tel:+7xxxxxxxxx' },
      { label: 'Email', value: 'dmitry@example.com', url: 'mailto:dmitry@example.com' },
      { label: 'Location', value: 'Remote' },
      { label: 'Rate', value: '$50-80/hour' },
    ],
    tags: [
      { name: 'Open for freelance' },
      { name: 'Available for mentoring' },
      { name: 'Working on side projects' }
    ],
    action: {
      label: 'Download CV',
      url: '/cv_en/cv.pdf',
      downloadedFileName: 'CV-Dmitry_B.pdf',
    },
    links: [
      { 
        label: 'GitHub', 
        icon: 'fa6-brands:github', 
        url: 'https://github.com/dmitry',
        color: '#333'
      },
      { 
        label: 'LinkedIn', 
        icon: 'fa6-brands:linkedin', 
        url: 'https://linkedin.com/in/dmitry',
        color: '#0077b5'
      },
      { 
        label: 'Twitter', 
        icon: 'fa6-brands:twitter', 
        url: 'https://twitter.com/dmitry',
        color: '#1da1f2'
      },
      { 
        label: 'Email', 
        icon: 'fa6-solid:envelope', 
        url: 'mailto:dmitry@example.com',
        color: '#ea4335'
      }
    ],
  };

  // Use CMS data if available, otherwise fallback
  const mainSection = aboutData.sections?.[0];
  
  return {
    config: {
      icon: 'fa6-solid:user',
      title: locale === 'ru' ? 'Профиль' : 'Profile',
      slug: 'profile',
      visible: true,
    },
    fullName: aboutData.title || fallbackData.fullName,
    role: mainSection?.heading || fallbackData.role,
    description: aboutData.lead || mainSection?.body || fallbackData.description,
    image: mainSection?.image || fallbackData.image,
    details: fallbackData.details,
    tags: fallbackData.tags,
    action: aboutData.cv_pdf ? {
      label: fallbackData.action.label,
      url: aboutData.cv_pdf,
      downloadedFileName: fallbackData.action.downloadedFileName,
    } : fallbackData.action,
    links: aboutData.links?.map(link => ({
      label: link.label,
      icon: link.icon || 'fa6-solid:link',
      url: link.url,
      color: '#6366f1', // Default color
    })) || fallbackData.links,
  };
}

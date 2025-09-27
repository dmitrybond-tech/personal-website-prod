export const mainData = {
  config: {
    icon: 'fa6-solid:user',
    title: 'Профиль',
    slug: 'profile',
    visible: true,
  },
  image: '/assets/my-image.jpeg',
  fullName: 'Дмитрий Б.',
  role: 'Senior Full-Stack разработчик',
  details: [
    { label: 'Телефон', value: '+7 (xxx) xxx-xx-xx', url: 'tel:+7xxxxxxxxx' },
    { label: 'Email', value: 'dmitry@example.com', url: 'mailto:dmitry@example.com' },
    { label: 'Местоположение', value: 'Удаленно' },
    { label: 'Ставка', value: '$50-80/час' },
  ],
  description: 'Опытный full-stack разработчик с экспертизой в современных веб-технологиях. Увлечен созданием эффективных, масштабируемых решений и менторством других разработчиков.',
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
};

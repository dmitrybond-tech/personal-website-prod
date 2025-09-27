export const bookmeData = {
  title: 'Записаться на встречу',
  subtitle: 'Запланируйте звонок для обсуждения вашего проекта',
  description: 'Я доступен для консультаций, менторства и обсуждения проектов. Выберите удобное время ниже.',
  cta: {
    label: 'Запланировать',
    url: '#calendar',
    variant: 'primary' as const,
  },
  features: [
    {
      title: 'Техническая консультация',
      description: 'Получите экспертную консультацию по вашему техническому стеку и архитектурным решениям.',
      icon: 'fa6-solid:code'
    },
    {
      title: 'Ревью кода',
      description: 'Профессиональный ревью кода и предложения по улучшению.',
      icon: 'fa6-solid:search'
    },
    {
      title: 'Менторство',
      description: 'Индивидуальные сессии менторства для развития карьеры.',
      icon: 'fa6-solid:graduation-cap'
    }
  ],
  availability: {
    timezone: 'UTC+3',
    workingHours: '9:00 - 18:00',
    days: 'Понедельник - Пятница'
  }
};


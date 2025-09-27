export const bookmeData = {
  title: 'Book a Meeting',
  subtitle: 'Schedule a call to discuss your project',
  description: 'I\'m available for consultation, mentoring, and project discussions. Choose a convenient time slot below.',
  cta: {
    label: 'Schedule Now',
    url: '#calendar',
    variant: 'primary' as const,
  },
  features: [
    {
      title: 'Technical Consultation',
      description: 'Get expert advice on your tech stack and architecture decisions.',
      icon: 'fa6-solid:code'
    },
    {
      title: 'Code Review',
      description: 'Professional code review and suggestions for improvement.',
      icon: 'fa6-solid:search'
    },
    {
      title: 'Mentoring',
      description: '1-on-1 mentoring sessions for career development.',
      icon: 'fa6-solid:graduation-cap'
    }
  ],
  availability: {
    timezone: 'UTC+3',
    workingHours: '9:00 AM - 6:00 PM',
    days: 'Monday - Friday'
  }
};

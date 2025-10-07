export const mainData = {
  config: {
    icon: 'fa6-solid:user',
    title: 'Profile',
    slug: 'profile',
    visible: true,
  },
  image: '/my-image.jpeg',
  fullName: 'Dmitry B.',
  role: 'Senior Full-Stack Developer',
  details: [
    { label: 'Phone', value: '+7 (xxx) xxx-xx-xx', url: 'tel:+7xxxxxxxxx' },
    { label: 'Email', value: 'dmitry@example.com', url: 'mailto:dmitry@example.com' },
    { label: 'Location', value: 'Remote' },
    { label: 'Rate', value: '$50-80/hour' },
  ],
  description: 'Experienced full-stack developer with expertise in modern web technologies. Passionate about creating efficient, scalable solutions and mentoring other developers.',
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


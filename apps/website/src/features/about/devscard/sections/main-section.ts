// Main section data
export const mainSection = {
  config: {
    title: 'Main',
    slug: 'main',
    icon: 'user' as const,
    visible: true
  },
  image: '/my-image.jpeg',
  fullName: 'Mark Freeman',
  role: 'Senior React Developer',
  description: 'Experienced frontend developer with expertise in React, TypeScript, and modern web technologies.',
  details: [
    {
      label: 'Phone',
      value: '605 475 6961',
      url: 'tel:605 475 6961'
    },
    {
      label: 'Email',
      value: 'mark.freeman.dev@gmail.com',
      url: 'mailto:mark.freeman.dev@gmail.com'
    },
    {
      label: 'Location',
      value: 'Wrocław, Poland'
    },
    {
      label: 'Website',
      value: 'markfreeman.dev',
      url: 'https://markfreeman.dev'
    }
  ],
  downloadButton: {
    label: 'Download CV',
    url: '/cv.pdf',
    downloadedFileName: 'Mark_Freeman_CV.pdf'
  },
  links: []
};

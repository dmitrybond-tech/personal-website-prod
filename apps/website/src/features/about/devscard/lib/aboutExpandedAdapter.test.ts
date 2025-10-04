import { describe, it, expect } from 'vitest';
import type { AboutExpanded } from './aboutExpandedSchema';
import { mapAboutExpandedToLegacy } from './aboutExpandedAdapter';

describe('aboutExpandedAdapter', () => {
  describe('mapAboutExpandedToLegacy', () => {
    it('should map complete about-expanded data to legacy format', () => {
      const expandedData: AboutExpanded = {
        title: 'About',
        slug: 'en/about',
        sections: [
          {
            type: 'main',
            data: {
              title: 'Profile',
              slug: 'profile',
              icon: 'fa6-solid:user',
              visible: true,
              fullName: 'Mark Freeman',
              role: 'Senior React Developer',
              image: '/devscard/my-image.jpeg',
              description: 'Experienced developer with 8+ years of experience.',
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
                }
              ],
              tags: [
                { name: 'Open for freelance' },
                { name: 'Available for mentoring' }
              ],
              action: {
                label: 'Download CV',
                url: '/devscard/cv.pdf',
                downloadedFileName: 'CV-Mark_Freeman.pdf'
              },
              links: [
                {
                  label: 'GitHub',
                  url: 'https://github.com/markfreeman',
                  icon: 'fa6-brands:github',
                  color: '#181717'
                },
                {
                  label: 'LinkedIn',
                  url: 'https://linkedin.com/in/markfreeman',
                  icon: 'fa6-brands:linkedin',
                  color: '#0A66C2'
                }
              ]
            }
          },
          {
            type: 'skills',
            data: {
              title: 'Skills',
              slug: 'skills',
              icon: 'fa6-solid:bars-progress',
              visible: true,
              skillSets: [
                {
                  title: 'I already know',
                  skills: [
                    {
                      name: 'React',
                      icon: 'fa6-brands:react',
                      level: 5,
                      description: 'Expert level React developer'
                    },
                    {
                      name: 'TypeScript',
                      icon: 'fa6-brands:typescript',
                      level: 4,
                      description: 'Strong TypeScript knowledge'
                    }
                  ]
                }
              ]
            }
          },
          {
            type: 'experience',
            data: {
              title: 'Experience',
              slug: 'experience',
              icon: 'fa6-solid:briefcase',
              visible: true,
              items: [
                {
                  company: 'CloudBlue',
                  location: 'Enschede, the Netherlands',
                  logo: '/logos/cloudblue.svg',
                  website: 'https://cloudblue.com',
                  roles: [
                    {
                      title: 'Delivery Manager',
                      period: 'Mar 2023 – Apr 2025',
                      description: 'Led partner enablement and post-launch support.',
                      bullets: [
                        'Led partner enablement and post-launch support across a cloud-based commerce platform.',
                        'Managed delivery of integration projects.'
                      ],
                      technologies: ['React', 'TypeScript', 'Node.js', 'AWS'],
                      links: [
                        {
                          label: 'Company Website',
                          url: 'https://cloudblue.com'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          },
          {
            type: 'favorites',
            data: {
              title: 'Favorites',
              slug: 'favorites',
              icon: 'fa6-solid:star',
              visible: true,
              style: {
                variant: 'tile',
                cols: {
                  base: 2,
                  sm: 3,
                  lg: 6
                }
              },
              groups: [
                {
                  title: 'Books I read',
                  type: 'books',
                  style: {
                    limit: 5
                  },
                  items: [
                    {
                      title: 'The Pragmatic Programmer',
                      author: 'Andy Hunt, Dave Thomas',
                      url: 'https://www.goodreads.com/book/show/4099.The_Pragmatic_Programmer',
                      image: '/devscard/favorites/books/book-1.jpeg'
                    }
                  ]
                },
                {
                  title: 'People I learn from',
                  type: 'people',
                  style: {
                    limit: 5
                  },
                  items: [
                    {
                      name: 'Kent C. Dodds',
                      url: 'https://kentcdodds.com/',
                      image: '/devscard/favorites/people/person-1.jpg'
                    }
                  ]
                }
              ]
            }
          }
        ]
      };

      const result = mapAboutExpandedToLegacy(expandedData);

      // Test config
      expect(result.config.meta.title).toBe('About');
      expect(result.config.i18n.locale).toBe('en');
      expect(result.config.i18n.translations.now).toBe('Present');

      // Test main section
      expect(result.sections.main.config.title).toBe('Profile');
      expect(result.sections.main.fullName).toBe('Mark Freeman');
      expect(result.sections.main.role).toBe('Senior React Developer');
      expect(result.sections.main.image).toBe('/devscard/my-image.jpeg');
      expect(result.sections.main.details).toHaveLength(2);
      expect(result.sections.main.details[0].label).toBe('Phone');
      expect(result.sections.main.details[0].value).toBe('605 475 6961');
      expect(result.sections.main.details[0].url).toBe('tel:605 475 6961');
      expect(result.sections.main.tags).toHaveLength(2);
      expect(result.sections.main.tags[0].name).toBe('Open for freelance');
      expect(result.sections.main.action.label).toBe('Download CV');
      expect(result.sections.main.action.url).toBe('/devscard/cv.pdf');
      expect(result.sections.main.action.downloadedFileName).toBe('CV-Mark_Freeman.pdf');
      expect(result.sections.main.links).toHaveLength(2);
      expect(result.sections.main.links[0].name).toBe('GitHub');
      expect(result.sections.main.links[0].url).toBe('https://github.com/markfreeman');

      // Test skills section
      expect(result.sections.skills.config.title).toBe('Skills');
      expect(result.sections.skills.skillSets).toHaveLength(1);
      expect(result.sections.skills.skillSets[0].title).toBe('I already know');
      expect(result.sections.skills.skillSets[0].skills).toHaveLength(2);
      expect(result.sections.skills.skillSets[0].skills[0].name).toBe('React');
      expect(result.sections.skills.skillSets[0].skills[0].level).toBe(5);
      expect(result.sections.skills.skillSets[0].skills[0].description).toBe('Expert level React developer');

      // Test experience section
      expect(result.sections.experience.config.title).toBe('Experience');
      expect(result.sections.experience.jobs).toHaveLength(1);
      expect(result.sections.experience.jobs[0].role).toBe('Delivery Manager');
      expect(result.sections.experience.jobs[0].company).toBe('CloudBlue');
      expect(result.sections.experience.jobs[0].image).toBe('/logos/cloudblue.svg');
      expect(result.sections.experience.jobs[0].tagsList.title).toBe('Technologies');
      expect(result.sections.experience.jobs[0].tagsList.tags).toHaveLength(4);
      expect(result.sections.experience.jobs[0].tagsList.tags[0].name).toBe('React');
      expect(result.sections.experience.jobs[0].links).toHaveLength(1);
      expect(result.sections.experience.jobs[0].links[0].name).toBe('Company Website');

      // Test favorites section
      expect(result.sections.favorites.config.title).toBe('Favorites');
      expect(result.sections.favorites.books).toBeDefined();
      expect(result.sections.favorites.books?.title).toBe('Books');
      expect(result.sections.favorites.books?.data).toHaveLength(1);
      expect(result.sections.favorites.books?.data[0].title).toBe('The Pragmatic Programmer');
      expect(result.sections.favorites.books?.data[0].author).toBe('Andy Hunt, Dave Thomas');
      expect(result.sections.favorites.people).toBeDefined();
      expect(result.sections.favorites.people?.title).toBe('People');
      expect(result.sections.favorites.people?.data).toHaveLength(1);
      expect(result.sections.favorites.people?.data[0].name).toBe('Kent C. Dodds');
    });

    it('should handle missing sections with defaults', () => {
      const expandedData: AboutExpanded = {
        title: 'About',
        slug: 'ru/about',
        sections: []
      };

      const result = mapAboutExpandedToLegacy(expandedData);

      // Test config
      expect(result.config.meta.title).toBe('About');
      expect(result.config.i18n.locale).toBe('ru');
      expect(result.config.i18n.translations.now).toBe('Настоящее время');

      // Test default sections
      expect(result.sections.main.config.title).toBe('Profile');
      expect(result.sections.main.fullName).toBe('Mark Freeman');
      expect(result.sections.skills.config.title).toBe('Skills');
      expect(result.sections.experience.config.title).toBe('Experience');
      expect(result.sections.favorites.config.title).toBe('Favorites');
      expect(result.sections.portfolio.config.visible).toBe(false);
      expect(result.sections.education.config.visible).toBe(false);
      expect(result.sections.testimonials.config.visible).toBe(false);
    });

    it('should handle partial data gracefully', () => {
      const expandedData: AboutExpanded = {
        title: 'About',
        slug: 'en/about',
        sections: [
          {
            type: 'main',
            data: {
              title: 'Profile',
              slug: 'profile',
              icon: 'fa6-solid:user',
              fullName: 'John Doe',
              role: 'Developer',
              image: '/avatar.jpg',
              description: 'A developer',
              details: [],
              tags: [],
              action: {
                label: 'Download',
                url: '/cv.pdf'
              },
              links: []
            }
          }
        ]
      };

      const result = mapAboutExpandedToLegacy(expandedData);

      // Should not throw and should provide defaults
      expect(result.sections.main.fullName).toBe('John Doe');
      expect(result.sections.main.role).toBe('Developer');
      expect(result.sections.main.visible).toBe(true);
      expect(result.sections.skills.skillSets).toHaveLength(0);
      expect(result.sections.experience.jobs).toHaveLength(0);
    });
  });
});

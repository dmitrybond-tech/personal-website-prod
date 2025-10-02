import { defineCollection, z } from 'astro:content';

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    lang: z.enum(['en', 'ru']),
    route: z.string(),
    updatedAt: z.date(),
    summary: z.string().optional(),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    lang: z.enum(['en', 'ru']),
    publishedAt: z.date(),
    tags: z.array(z.string()).optional(),
    summary: z.string().optional(),
  }),
});

const legal = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    lang: z.enum(['en', 'ru']),
    updatedAt: z.date(),
    summary: z.string().optional(),
  }),
});

const aboutPage = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    profile: z.object({
      fullName: z.string(),
      title: z.string(),
      avatar: z.string().optional(),
    }),
    sections: z.array(z.object({
      heading: z.string(),
      body: z.string(),
      icon: z.string().optional(),
      image: z.string().optional(),
    })),
    links: z.array(z.string()).optional(),
    cv_pdf: z.string().optional(),
    gallery: z.array(z.string()).optional(),
  }),
});

const bookmeConfig = defineCollection({
  type: 'data',
  schema: z.object({
    page_title: z.string().optional(),
    page_subtitle: z.string().optional(),
    cal: z.object({
      handle: z.string(),
      eventType: z.string().optional(),
      attrs: z.record(z.string()).optional(),
    }),
    tiles: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      image: z.string().optional(),
      cta_text: z.string(),
      cta_kind: z.enum(['cal', 'link', 'mailto', 'download']),
      cal_preset: z.string().optional(),
      href: z.string().optional(),
      visible: z.boolean(),
      icon: z.string().optional(),
    })),
    footer_note: z.string().optional(),
  }),
});

export const collections = {
  pages,
  blog,
  legal,
  aboutPage,
  bookmeConfig,
};
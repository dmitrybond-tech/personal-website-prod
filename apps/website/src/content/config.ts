import { defineCollection, z } from 'astro:content';

const sectionBase = z.object({
  type: z.string(),
  data: z.record(z.any()).passthrough()
});

const aboutPage = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().optional(),
    slug: z.string().optional(),
    sections: z.array(sectionBase).default([]),
  }).passthrough(),
});

const bookmePage = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().optional(),
    cal_link: z.string().optional(),   // например: your-cal-handle/intro
    intro: z.string().optional(),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    publishedAt: z.date(),
    tags: z.array(z.string()).optional(),
    summary: z.string().optional(),
  }),
});

const legal = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    updatedAt: z.date(),
    summary: z.string().optional(),
  }),
});

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    updatedAt: z.date(),
    summary: z.string().optional(),
  }),
});

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    publishedAt: z.date(),
    tags: z.array(z.string()).optional(),
    summary: z.string().optional(),
  }),
});

const footer = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string().optional(),
    links: z.array(z.object({
      label: z.string(),
      url: z.string(),
    })).optional(),
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
    }),
  }),
});

export const collections = { 
  aboutPage, 
  bookmePage, 
  blog, 
  legal, 
  pages, 
  posts, 
  footer, 
  bookmeConfig 
};
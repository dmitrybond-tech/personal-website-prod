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

export const collections = {
  pages,
  blog,
  legal,
};
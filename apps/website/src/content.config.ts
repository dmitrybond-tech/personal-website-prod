import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      lang: z.enum(["en", "ru"]),
      publishedAt: z.coerce.date(),
      description: z.string().optional(),
      tags: z.array(z.string()).default([]),
      cover: image().optional(),
    }),
});

const legal = defineCollection({
  type: "content",
  schema: z.object({
    lang: z.enum(["en","ru"]),
    title: z.string(),
    draft: z.boolean().optional()
  })
});

const footer = defineCollection({
  type: "data",
  schema: z.object({
    lang: z.enum(["en","ru"]),
    links: z.array(z.object({ label: z.string(), href: z.string() }))
  })
});

const posts = defineCollection({
  type: 'content',
  // slug = только basename без "{locale}/"
  slug: ({ defaultSlug }) => defaultSlug,
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    draft: z.boolean().optional().default(false),
    // опционально для дизайна:
    tags: z.array(z.string()).optional().default([]),
    cover: z.string().optional(), // если в лейауте есть обложка
  }),
});

// Pass-through to silence auto-generation warnings without refactor
const en = defineCollection({ type: "content" });
const ru = defineCollection({ type: "content" });
const pages = defineCollection({ type: "content" });

export const collections = { blog, legal, footer, posts, en, ru, pages };

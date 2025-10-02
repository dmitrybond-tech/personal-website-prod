import { defineCollection, z } from "astro:content";

function normalizeDate(input: unknown): unknown {
  if (typeof input !== 'string') return input;

  // Трим + замена типографских тире на обычные
  let s = input.trim().replace(/\u2012|\u2013|\u2014|\u2212/g, '-');

  // Уже ISO?
  if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(s)) return s;

  // DD.MM.YYYY | DD/MM/YYYY | DD-MM-YYYY
  const m = s.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/);
  if (m) {
    const [_, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }

  return s; // пусть попробует z.coerce.date()
}

const blog = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      lang: z.enum(["en", "ru"]),
      publishedAt: z.preprocess(normalizeDate, z.coerce.date()),
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
    date: z.preprocess(normalizeDate, z.coerce.date()),
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

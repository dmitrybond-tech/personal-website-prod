import { defineCollection, z } from "astro:content";

function sanitizeDate(input: unknown): string | Date {
  if (input instanceof Date) return input;
  if (typeof input !== 'string') return new Date();

  let s = input
    .replace(/[\u0000-\u001F]/g, '')
    .replace(/[\u2012\u2013\u2014\u2212]/g, '-')
    .replace(/[^\d\-./]/g, '')
    .trim();

  if (!s) return new Date();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const m = s.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  const d = new Date(s);
  return isNaN(+d) ? new Date() : d;
}

// Alias for backward compatibility
const normalizeDate = sanitizeDate;

const blog = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      lang: z.enum(["en", "ru"]),
      publishedAt: z.preprocess(sanitizeDate, z.coerce.date()),
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
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.preprocess(sanitizeDate, z.coerce.date()),
    draft: z.boolean().optional().default(false),
    tags: z.array(z.string()).optional().default([]),
    cover: z.string().optional(),
  }),
});

// About page collection
const aboutPage = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      lead: z.string().optional(),
      sections: z.array(
        z.object({
          icon: z.string().optional(),
          heading: z.string().optional(),
          body: z.string().optional(),
          image: image().optional(),
        })
      ).optional(),
      links: z.array(
        z.object({
          label: z.string(),
          url: z.string(),
          icon: z.string().optional(),
        })
      ).optional(),
      cv_pdf: z.string().optional(),
      gallery: z.array(image()).optional(),
    }),
});

// Book.me page collection
const bookmeConfig = defineCollection({
  type: "data",
  schema: z.object({
    page_title: z.string().optional(),
    page_subtitle: z.string().optional(),
    cal: z.object({
      handle: z.string(),
      eventType: z.string().optional(),
      attrs: z.record(z.string()).optional(),
    }),
    tiles: z.array(
      z.object({
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
      })
    ),
    footer_note: z.string().optional(),
  }),
});

// Pass-through to silence auto-generation warnings without refactor
const en = defineCollection({ type: "content" });
const ru = defineCollection({ type: "content" });
const pages = defineCollection({ type: "content" });

export const collections = { blog, legal, footer, posts, aboutPage, bookmeConfig, en, ru, pages };

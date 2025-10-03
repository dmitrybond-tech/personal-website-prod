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

// i18n helper for string or { en, ru } objects
const i18n = z.union([z.string(), z.object({ en: z.string(), ru: z.string() })]);

// Hero section data schema
const HeroData = z.object({
  name: i18n.optional(),
  role: i18n.optional(),
  avatar: z.string().optional(),
  avatarSizePx: z.number().optional(),
  location: i18n.optional(),
  bio: i18n.optional(),
  cv_url: z.string().optional(),
  links: z.array(
    z.object({
      label: i18n,
      url: z.string(),
      icon: z.string().optional(),
    }).passthrough()
  ).optional(),
  badges: z.array(
    z.object({
      name: i18n,
    }).passthrough()
  ).optional(),
}).passthrough();

// Skill item schema
const SkillItem = z.object({
  name: z.string(),
  icon: z.string().optional(),
  url: z.string().url().optional(),
  level: z.number().min(1).max(5).optional(),
  description: z.string().optional(),
}).passthrough();

// Skill group schema
const SkillGroup = z.object({
  title: i18n,
  items: z.array(SkillItem),
}).passthrough();

// Skills section data schema
const SkillsData = z.object({
  title: i18n.optional(),
  groups: z.array(SkillGroup).optional(),
  items: z.array(SkillItem).optional(), // fallback for flat list
  style: z.object({
    showLevelBar: z.boolean().optional(),
    cols: z.object({ 
      base: z.number().optional(), 
      sm: z.number().optional(), 
      lg: z.number().optional() 
    }).optional(),
  }).passthrough().optional(),
}).passthrough();

// Role inside a company
const ExperienceRole = z.object({
  title: i18n,                      // "Delivery Manager"
  period: i18n,                     // "Mar 2023 – Apr 2025" (keep as string)
  bullets: z.array(i18n).optional() // bullet points
}).passthrough();

// Company
const ExperienceCompany = z.object({
  company: i18n,                    // "CloudBlue"
  location: i18n.optional(),        // "Enschede, the Netherlands"
  url: z.string().url().optional(),
  logo: z.string().optional(),      // /logos/cloudblue.svg
  roles: z.array(ExperienceRole)    // one or many roles at this company
}).passthrough();

// Legacy Experience item schema (for backward compatibility)
const ExperienceItem = z.object({
  company: i18n,
  role: i18n,
  dates: z.tuple([z.string(), z.string().optional()]).optional(),
  location: i18n.optional(),
  description: i18n.optional(),
  image: z.string().optional(),
  stack: z.array(z.string()).optional(),
  bullets: z.array(i18n).optional(),
  links: z.array(
    z.object({
      label: i18n,
      url: z.string(),
      icon: z.string().optional(),
    }).passthrough()
  ).optional(),
  tagsList: z.object({
    title: i18n.optional(),
    tags: z.array(z.object({ name: z.string() })).optional(),
  }).passthrough().optional(),
}).passthrough();

// Experience section data schema
const ExperienceData = z.object({
  title: i18n.optional(),
  items: z.array(ExperienceCompany).optional(), // preferred structure
  // Keep accepting old flat entries if present and normalize at runtime
  legacyItems: z.array(ExperienceItem).optional(), // fallback for backward compatibility
}).passthrough();

// Degree item inside an institution
const EducationDegree = z.object({
  degree: i18n.optional(),        // "BSc" / "Бакалавр"
  program: i18n.optional(),       // "Information and Computing Technology"
  faculty: i18n.optional(),       // "Faculty of Computer Science and Engineering"
  period: i18n,                   // "Sep 2012 – Sep 2016"
  bullets: z.array(i18n).optional()
}).passthrough();

// Institution
const EducationInstitution = z.object({
  school: i18n,                   // "Siberian State University of Telecommunications and Information Sciences (SibSUTIS)"
  location: i18n.optional(),      // optional
  url: z.string().url().optional(), // <- NEW
  logo: z.string().optional(),    // /logos/sibsutis.svg
  degrees: z.array(EducationDegree)
}).passthrough();

// Legacy Education item schema (for backward compatibility)
const EducationItem = z.object({
  institution: i18n,
  degree: i18n,
  field: i18n.optional(),
  dates: z.tuple([z.string(), z.string().optional()]).optional(),
  description: i18n.optional(),
  image: z.string().optional(),
  achievements: z.array(i18n).optional(),
  gpa: z.string().optional(),
  location: i18n.optional(),
}).passthrough();

// Education section data schema
const EducationData = z.object({
  title: i18n.optional(),
  items: z.array(EducationInstitution).optional(), // preferred structure
  // Keep accepting old flat entries if present and normalize at runtime
  legacyItems: z.array(EducationItem).optional(), // fallback for backward compatibility
}).passthrough();

// Favorites group item schema
const FavoriteItem = z.object({
  id: z.string().optional(),
  name: i18n.optional(),
  title: i18n.optional(),
  author: i18n.optional(),
  image: z.string().optional(),
  url: z.string().optional(),
  description: i18n.optional(),
  category: i18n.optional(),
}).passthrough();

// Favorites group schema
const FavoriteGroup = z.object({
  title: i18n,
  items: z.array(FavoriteItem),
}).passthrough();

// Favorites section data schema
const FavoritesData = z.object({
  title: z.string().optional(),
  style: z.object({
    variant: z.enum(['tile', 'chip']).optional(),
    cols: z.object({
      base: z.number().optional(),
      sm: z.number().optional(),
      lg: z.number().optional(),
    }).optional(),
  }).passthrough().optional(),
  groups: z.array(FavoriteGroup),
}).passthrough();

// Section schema as discriminated union
const SectionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hero'), data: HeroData }),
  z.object({ type: z.literal('skills'), data: SkillsData }),
  z.object({ type: z.literal('experience'), data: ExperienceData }),
  z.object({ type: z.literal('education'), data: EducationData }),
  z.object({ type: z.literal('favorites'), data: FavoritesData }),
]).or(
  // Fallback for unknown section types
  z.object({ type: z.string(), data: z.record(z.any()) })
);

// About page collection
const aboutPage = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string().optional(),
      lead: z.string().optional(),
      sections: z.array(SectionSchema).optional(),
      links: z.array(
        z.object({
          label: z.string(),
          url: z.string(),
          icon: z.string().optional(),
        }).passthrough() // Allow additional fields in links
      ).optional(),
      cv_pdf: z.string().optional(),
      gallery: z.array(image()).optional(),
    }).passthrough(), // Allow additional top-level fields from DevsCard
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

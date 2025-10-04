import { z } from 'zod';

// Base schemas for shared types
const LabelledValueSchema = z.object({
  label: z.string(),
  value: z.string(),
  url: z.string().optional(),
});

const LinkButtonSchema = z.object({
  label: z.string(),
  url: z.string(),
  icon: z.string(),
  color: z.string().optional(),
});

const TagSchema = z.object({
  name: z.string(),
});

const DownloadButtonSchema = z.object({
  label: z.string(),
  url: z.string(),
  downloadedFileName: z.string().optional(),
});

// Section-specific schemas
const MainSectionDataSchema = z.object({
  title: z.string(),
  slug: z.string(),
  icon: z.string(),
  visible: z.boolean().optional().default(true),
  fullName: z.string(),
  role: z.string(),
  image: z.string(),
  description: z.string(),
  details: z.array(LabelledValueSchema),
  tags: z.array(TagSchema),
  action: DownloadButtonSchema,
  links: z.array(LinkButtonSchema),
});

const SkillSchema = z.object({
  name: z.string(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  icon: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
});

const SkillsCategorySchema = z.object({
  title: z.string(),
  skills: z.array(SkillSchema),
});

const SkillsSectionDataSchema = z.object({
  title: z.string(),
  slug: z.string(),
  icon: z.string(),
  visible: z.boolean().optional().default(true),
  categories: z.array(SkillsCategorySchema),
});

const JobRoleSchema = z.object({
  title: z.string(),
  period: z.string(),
  description: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  links: z.array(LinkButtonSchema).optional(),
});

const ExperienceItemSchema = z.object({
  company: z.string(),
  location: z.string().optional(),
  logo: z.string().optional(),
  website: z.string().optional(),
  roles: z.array(JobRoleSchema),
});

const ExperienceSectionDataSchema = z.object({
  title: z.string(),
  slug: z.string(),
  icon: z.string(),
  visible: z.boolean().optional().default(true),
  items: z.array(ExperienceItemSchema),
});

const FavoritesItemSchema = z.object({
  title: z.string(),
  name: z.string().optional(),
  author: z.string().optional(),
  type: z.string().optional(),
  url: z.string().optional(),
  image: z.string().optional(),
  description: z.string().optional(),
});

const FavoritesGroupSchema = z.object({
  title: z.string(),
  type: z.string(),
  style: z.object({
    limit: z.number().optional(),
  }).optional(),
  items: z.array(FavoritesItemSchema),
});

const FavoritesStyleSchema = z.object({
  variant: z.string().optional(),
  cols: z.object({
    base: z.number().optional(),
    sm: z.number().optional(),
    lg: z.number().optional(),
  }).optional(),
});

const FavoritesSectionDataSchema = z.object({
  title: z.string(),
  slug: z.string(),
  icon: z.string(),
  visible: z.boolean().optional().default(true),
  style: FavoritesStyleSchema.optional(),
  groups: z.array(FavoritesGroupSchema),
});

// Section union schema
const SectionDataSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('main'),
    data: MainSectionDataSchema,
  }),
  z.object({
    type: z.literal('skills'),
    data: SkillsSectionDataSchema,
  }),
  z.object({
    type: z.literal('experience'),
    data: ExperienceSectionDataSchema,
  }),
  z.object({
    type: z.literal('favorites'),
    data: FavoritesSectionDataSchema,
  }),
  // Add other section types as needed
  z.object({
    type: z.string(),
    data: z.any(),
  }),
]);

// Main schema for the about-expanded.md file
export const AboutExpandedSchema = z.object({
  title: z.string(),
  slug: z.string(),
  sections: z.array(SectionDataSchema),
});

// Type inference
export type AboutExpanded = z.infer<typeof AboutExpandedSchema>;
export type AboutExpandedSection = z.infer<typeof SectionDataSchema>;
export type AboutExpandedMainSection = z.infer<typeof MainSectionDataSchema>;
export type AboutExpandedSkillsSection = z.infer<typeof SkillsSectionDataSchema>;
export type AboutExpandedExperienceSection = z.infer<typeof ExperienceSectionDataSchema>;
export type AboutExpandedFavoritesSection = z.infer<typeof FavoritesSectionDataSchema>;

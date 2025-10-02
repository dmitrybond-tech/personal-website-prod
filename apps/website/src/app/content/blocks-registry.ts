export type BlockSpec = { type: string; props?: Record<string, any> };
type Loader = () => Promise<{ default: any }>;

// Map your CMS "block.type" to actual components here.
// Add more entries as you add widgets.
export const blockLoaders: Record<string, Loader> = {
  hero: () => import('@/app/widgets/hero/Hero.astro'),
  experience: () => import('@/app/widgets/exp/Experience.astro'),
  tech: () => import('@/app/widgets/tech/Tech.astro'),
  cta: () => import('@/app/widgets/cta/CTA.astro'),
};

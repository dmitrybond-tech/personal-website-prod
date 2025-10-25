import { getCollection, type CollectionEntry } from 'astro:content';

export async function getPageByRoute(lang: 'en' | 'ru', route: string) {
  const pages = await getCollection('pages');
  return pages.find((page: CollectionEntry<'pages'>) => page.data.lang === lang && page.data.route === route) || null;
}

export async function listBlog(lang: 'en' | 'ru') {
  const blog = await getCollection('blog');
  return blog
    .filter((post: CollectionEntry<'blog'>) => post.data.lang === lang)
    .sort((a: CollectionEntry<'blog'>, b: CollectionEntry<'blog'>) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

export async function getBlogBySlug(lang: 'en' | 'ru', slug: string) {
  const blog = await getCollection('blog');
  return blog.find((post: CollectionEntry<'blog'>) => post.data.lang === lang && post.slug === slug) || null;
}

export async function listLegal(lang: 'en' | 'ru') {
  const legal = await getCollection('legal');
  return legal
    .filter((doc: CollectionEntry<'legal'>) => doc.data.lang === lang && !doc.data.draft)
    .sort((a: CollectionEntry<'legal'>, b: CollectionEntry<'legal'>) => {
      const aTime = a.data.updatedAt ? new Date(a.data.updatedAt).getTime() : 0;
      const bTime = b.data.updatedAt ? new Date(b.data.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
}

export async function getLegalBySlug(lang: 'en' | 'ru', slug: string) {
  const legal = await getCollection('legal');
  return legal.find((doc: CollectionEntry<'legal'>) => doc.data.lang === lang && doc.slug === slug) || null;
}
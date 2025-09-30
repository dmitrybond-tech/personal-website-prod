import { getCollection } from 'astro:content';

export async function getPageByRoute(lang: 'en' | 'ru', route: string) {
  const pages = await getCollection('pages');
  return pages.find(page => page.data.lang === lang && page.data.route === route) || null;
}

export async function listBlog(lang: 'en' | 'ru') {
  const blog = await getCollection('blog');
  return blog
    .filter(post => post.data.lang === lang)
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

export async function getBlogBySlug(lang: 'en' | 'ru', slug: string) {
  const blog = await getCollection('blog');
  return blog.find(post => post.data.lang === lang && post.slug === slug) || null;
}

export async function listLegal(lang: 'en' | 'ru') {
  const legal = await getCollection('legal');
  return legal
    .filter(doc => doc.data.lang === lang)
    .sort((a, b) => b.data.updatedAt.getTime() - a.data.updatedAt.getTime());
}

export async function getLegalBySlug(lang: 'en' | 'ru', slug: string) {
  const legal = await getCollection('legal');
  return legal.find(doc => doc.data.lang === lang && doc.slug === slug) || null;
}
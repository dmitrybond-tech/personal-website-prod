import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// Type definitions for the favorites data structure
type FavoriteItem = {
  title: string;
  author?: string;
  image?: string;
  url?: string;
};

type FavoriteGroup = {
  title: string | {en?: string; ru?: string};
  style?: { limit?: number; cols?: { base?: number; sm?: number; lg?: number } };
  items: FavoriteItem[];
};

type FavoritesData = {
  title?: string | {en?: string; ru?: string};
  style?: { variant?: 'tile'|'chip'; cols?: { base?: number; sm?: number; lg?: number } };
  groups: FavoriteGroup[];
};

// EN payload
const EN_FAVORITES: FavoritesData = {
  title: "Favorites",
  style: { variant: "tile", cols: { base: 2, sm: 3, lg: 6 } },
  groups: [
    {
      title: "Hobbies",
      style: { limit: 5 },
      items: [
        { title: "Technologies", url: "https://github.com/trending" },
        { title: "Snowboarding", url: "https://www.redbull.com/us-en/snowboarding" },
        { title: "Art", url: "https://www.artsy.net" },
        { title: "Stand-up Comedy", url: "https://www.netflix.com/browse/genre/11559" },
        { title: "Cooking", url: "https://www.bonappetit.com" }
      ]
    },
    {
      title: "People I Follow",
      style: { limit: 5 },
      items: [
        { title: "Joe Rogan", url: "https://www.youtube.com/@joerogan" },
        { title: "Seth Rogen", url: "https://www.instagram.com/sethrogen" },
        { title: "Mark Manson", url: "https://markmanson.net" },
        { title: "Travis Rice", url: "https://www.instagram.com/travisrice" },
        { title: "Andrew Huberman", url: "https://www.youtube.com/@hubermanlab" }
      ]
    },
    {
      title: "Media I Follow",
      style: { limit: 5 },
      items: [
        { title: "BBC", url: "https://www.bbc.com" },
        { title: "Y Combinator", url: "https://www.ycombinator.com" },
        { title: "Red Bull Media House", url: "https://www.redbull.com" },
        { title: "Artsy", url: "https://www.artsy.net" },
        { title: "Inked Magazine", url: "https://www.inkedmag.com" }
      ]
    },
    {
      title: "Books",
      style: { limit: 5 },
      items: [
        { title: "How to Create Tech Products Customers Love", url: "https://www.goodreads.com/book/show/18043039-how-to-create-tech-products-customers-love" },
        { title: "Shantaram", url: "https://www.goodreads.com/book/show/33600.Shantaram" },
        { title: "The Subtle Art of Not Giving a Fuck", url: "https://www.goodreads.com/book/show/28257707-the-subtle-art-of-not-giving-a-f-ck" },
        { title: "Idiot", url: "https://www.goodreads.com/book/show/18043039-how-to-create-tech-products-customers-love" },
        { title: "Crime and Punishment", url: "https://www.goodreads.com/book/show/7144.Crime_and_Punishment" }
      ]
    },
    {
      title: "Movies",
      style: { limit: 5 },
      items: [
        { title: "Pulp Fiction", url: "https://www.imdb.com/title/tt0110912" },
        { title: "Spirited Away", url: "https://www.imdb.com/title/tt0245429" },
        { title: "The Big Lebowski", url: "https://www.imdb.com/title/tt0118715" },
        { title: "Snatch", url: "https://www.imdb.com/title/tt0208092" },
        { title: "Fight Club", url: "https://www.imdb.com/title/tt0137523" }
      ]
    }
  ]
};

// RU payload (translated titles)
const RU_FAVORITES: FavoritesData = {
  title: "Избранное",
  style: { variant: "tile", cols: { base: 2, sm: 3, lg: 6 } },
  groups: [
    {
      title: "Хобби",
      style: { limit: 5 },
      items: [
        { title: "Технологии", url: "https://github.com/trending" },
        { title: "Сноуборд", url: "https://www.redbull.com/us-en/snowboarding" },
        { title: "Искусство", url: "https://www.artsy.net" },
        { title: "Стендап", url: "https://www.netflix.com/browse/genre/11559" },
        { title: "Кулинария", url: "https://www.bonappetit.com" }
      ]
    },
    {
      title: "Люди, за которыми я слежу",
      style: { limit: 5 },
      items: [
        { title: "Джо Роган", url: "https://www.youtube.com/@joerogan" },
        { title: "Сет Роген", url: "https://www.instagram.com/sethrogen" },
        { title: "Марк Мэнсон", url: "https://markmanson.net" },
        { title: "Трэвис Райс", url: "https://www.instagram.com/travisrice" },
        { title: "Эндрю Хуберман", url: "https://www.youtube.com/@hubermanlab" }
      ]
    },
    {
      title: "Медиа, за которыми я слежу",
      style: { limit: 5 },
      items: [
        { title: "BBC", url: "https://www.bbc.com" },
        { title: "Y Combinator", url: "https://www.ycombinator.com" },
        { title: "Red Bull Media House", url: "https://www.redbull.com" },
        { title: "Artsy", url: "https://www.artsy.net" },
        { title: "Inked Magazine", url: "https://www.inkedmag.com" }
      ]
    },
    {
      title: "Книги",
      style: { limit: 5 },
      items: [
        { title: "Как создавать технологические продукты, которые любят клиенты", url: "https://www.goodreads.com/book/show/18043039-how-to-create-tech-products-customers-love" },
        { title: "Шантарам", url: "https://www.goodreads.com/book/show/33600.Shantaram" },
        { title: "Тонкое искусство пофигизма", url: "https://www.goodreads.com/book/show/28257707-the-subtle-art-of-not-giving-a-f-ck" },
        { title: "Идиот", url: "https://www.goodreads.com/book/show/18043039-how-to-create-tech-products-customers-love" },
        { title: "Преступление и наказание", url: "https://www.goodreads.com/book/show/7144.Crime_and_Punishment" }
      ]
    },
    {
      title: "Фильмы",
      style: { limit: 5 },
      items: [
        { title: "Криминальное чтиво", url: "https://www.imdb.com/title/tt0110912" },
        { title: "Унесённые призраками", url: "https://www.imdb.com/title/tt0245429" },
        { title: "Большой Лебовски", url: "https://www.imdb.com/title/tt0118715" },
        { title: "Большой куш", url: "https://www.imdb.com/title/tt0208092" },
        { title: "Бойцовский клуб", url: "https://www.imdb.com/title/tt0137523" }
      ]
    }
  ]
};

function updateLocale(lang: 'en'|'ru', payload: FavoritesData) {
  const file = path.join(process.cwd(), 'apps/website/src/content/aboutPage', lang, 'about.md');
  
  if (!fs.existsSync(file)) {
    console.error(`[favorites] File not found: ${file}`);
    return;
  }

  const fm = matter.read(file);
  const sections = Array.isArray(fm.data.sections) ? fm.data.sections : [];
  
  // Find existing favorites section
  const idx = sections.findIndex((s: any) => s?.type === 'favorites');
  
  // Create new favorites section
  const next = { type: 'favorites', data: payload };
  
  if (idx === -1) {
    // Add new section if not found
    sections.push(next);
    console.log(`[favorites] Added new favorites section to ${lang}/about.md`);
  } else {
    // Update existing section
    sections[idx] = next;
    console.log(`[favorites] Updated existing favorites section in ${lang}/about.md`);
  }
  
  // Update the frontmatter
  fm.data.sections = sections;
  
  // Write back to file with proper formatting
  const content = matter.stringify(fm.content, fm.data, {
    delimiters: '---',
    language: 'yaml'
  });
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`[favorites] Successfully updated ${lang}/about.md`);
}

// Main execution
console.log('[favorites] Starting favorites update...');

try {
  updateLocale('en', EN_FAVORITES);
  updateLocale('ru', RU_FAVORITES);
  console.log('[favorites] All locales updated successfully!');
} catch (error) {
  console.error('[favorites] Error updating favorites:', error);
  process.exit(1);
}

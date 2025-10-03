import Hero from './sections/Hero.astro';
import Skills from './sections/Skills.astro';
import Experience from './sections/Experience.astro';
import Education from './sections/Education.astro';
import Favorites from './sections/Favorites.astro';
import Projects from './sections/Projects.astro';
import Testimonials from './sections/Testimonials.astro';
import Cards from './sections/Cards.astro';

export const registry: Record<string, any> = {
  hero: Hero,
  skills: Skills,
  experience: Experience,
  education: Education,
  favorites: Favorites,
  projects: Projects,
  testimonials: Testimonials,
  cards: Cards,
};

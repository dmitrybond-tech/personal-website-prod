export type SectionType = 'hero'|'skills'|'experience'|'education'|'projects'|'testimonials'|'favorites';

export interface Section { 
  id?: string; 
  type: SectionType; 
  heading?: string; 
  icon?: string; 
  image?: string; 
  data?: Record<string, any>; 
}

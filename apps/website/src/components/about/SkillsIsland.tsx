import React from 'react';
import SkillChip from './SkillChip';

export type SkillItem = {
  id?: string;
  name: string;
  icon?: string;
  url?: string;
  level?: 1|2|3|4|5;
  description?: string;
  [k: string]: any;
};

type SkillGroup = { 
  title: string | { en: string; ru: string }; 
  items: SkillItem[] 
};

type SkillsData = {
  title?: string | { en: string; ru: string };
  groups?: SkillGroup[];
  items?: SkillItem[];
  style?: {
    showLevelBar?: boolean;
    cols?: { 
      base?: number; 
      sm?: number; 
      lg?: number 
    };
  };
};

// Helper function for i18n
const t = (obj: any, lang: 'en' | 'ru' = 'en') => 
  typeof obj === 'object' && obj ? (obj[lang] ?? obj.en ?? '') : (obj ?? '');

// H3 component with token-based color
function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold tracking-tight mb-3">
      {children}
    </h3>
  );
}

export default function SkillsIsland({ data }: { data: SkillsData }) {
  const base = data.style?.cols?.base ?? 1;
  const sm = data.style?.cols?.sm ?? 2;
  const lg = data.style?.cols?.lg ?? 3;
  const gridClass = `grid grid-cols-${base} sm:grid-cols-${sm} lg:grid-cols-${lg} gap-3`;

  // Normalize input data and create groups
  const groups = React.useMemo(() => {
    if (Array.isArray(data.groups) && data.groups.length) {
      // Use existing groups, filter out empty ones
      return data.groups
        .filter(g => Array.isArray(g.items) && g.items.length)
        .map(g => ({
          title: g.title,
          items: g.items.map((item, idx) => ({
            id: item.id ?? `${item.name?.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${idx}`,
            ...item
          }))
        }));
    }
    
    // Auto-partition flat items if no groups provided
    if (Array.isArray(data.items) && data.items.length) {
      const items = data.items.slice();
      const ORDER = ['General', 'Frameworks', 'Technical', 'Languages'];
      const parts = [3, 6, 6, 3];
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[skills] partitioned flat items → groups');
      }
      
      return ORDER.map((title, idx) => ({
        title,
        items: items.splice(0, parts[idx]).map((item, itemIdx) => ({
          id: item.id ?? `${item.name?.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${itemIdx}`,
          ...item
        }))
      })).filter(g => g.items.length);
    }
    
    return [];
  }, [data]);

  const renderGrid = (items: SkillItem[]) => (
    <ul role="list" className={gridClass}>
      {items.map((item) => (
        <li key={item.id}>
          <SkillChip 
            {...(data.style?.showLevelBar === false ? { ...item, level: undefined } : item)} 
          />
        </li>
      ))}
    </ul>
  );

  if (!groups.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      {groups.map((group, gi) => (
        <section key={gi}>
          <H3>
            {typeof group.title === 'string' ? group.title : (group.title?.en ?? 'Untitled')}
          </H3>
          {renderGrid(group.items)}
        </section>
      ))}
    </div>
  );
}

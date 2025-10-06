import React from 'react';

export type FavoriteItem = {
  id?: string;
  name?: string;
  title?: string;
  author?: string;
  image?: string;
  url?: string;
  description?: string;
  category?: string;
};

export type FavoriteGroup = {
  title: string;
  items: FavoriteItem[];
  style?: {
    variant?: 'tile' | 'chip';
    size?: 'sm' | 'md' | 'lg';
    limit?: number;
  };
};

export default function FavoritesIsland({ groups = [], style }: { groups?: FavoriteGroup[]; style?: { variant?: 'tile' | 'chip' } }) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="cv-muted">No favorites to display.</p>
      </div>
    );
  }

  // Define group order priority with Hobbies first
  const groupOrder = ['Hobbies', 'Persons I Follow', 'Media I Follow', 'Books', 'Movies'];
  const sortedGroups = [...groups].sort((a, b) => {
    const aIndex = groupOrder.indexOf(a.title);
    const bIndex = groupOrder.indexOf(b.title);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <div className="space-y-6">
      {sortedGroups.map((group, groupIndex) => {
        // Default one row of 4 tiles
        const limit = group.style?.limit ?? 4;
        const items = (group.items ?? []).slice(0, limit);

        return (
          <div key={groupIndex}>
            {/* Group Title */}
            {group.title && (
              <h3 className="text-sm font-semibold cv-muted mb-3">
                {group.title}
              </h3>
            )}
            
            {/* Items Horizontal List */}
            {items.length > 0 ? (
              <div className="overflow-x-auto">
                <ul className="inline-flex gap-4 lg:gap-6 whitespace-nowrap">
                  {items.map((item, itemIndex) => {
                    const displayTitle = item.title || item.name || '—';
                    const displaySubtitle = item.author || item.category || '';
                    const itemId = item.id || `${groupIndex}-${itemIndex}`;
                    
                    return (
                      <li key={itemId} className="shrink-0 w-[160px]">
                        <FavoriteTile 
                          item={item} 
                          title={displayTitle} 
                          subtitle={displaySubtitle}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="cv-muted text-sm">No items in this category.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FavoriteTile({ 
  item, 
  title, 
  subtitle
}: { 
  item: FavoriteItem; 
  title: string; 
  subtitle?: string;
}) {
  const body = (
    <div className="group text-center">
      <div className="mx-auto relative aspect-square size-[160px] rounded-xl overflow-hidden bg-[var(--cv-surface-2)]">
        {item.image ? (
          <img 
            src={item.image} 
            alt="" 
            className="size-full object-cover" 
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="size-full" />
        )}

        {/* Hover overlay with domain */}
        {item.url && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/35 flex items-center justify-center">
            <span className="px-2 py-1 text-[10px] text-white/90 rounded-md bg-black/50">
              {(() => { 
                try { 
                  return new URL(item.url!).host; 
                } catch { 
                  return 'Open'; 
                } 
              })()}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2">
        <div className="text-xs font-medium truncate">{title}</div>
        {subtitle && (
          <div className="text-[10px] cv-muted truncate">{subtitle}</div>
        )}
      </div>
    </div>
  );

  return item.url ? (
    <a 
      href={item.url} 
      target="_blank" 
      rel="noopener noreferrer" 
      title={item.url} 
      className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cv-ring)]"
    >
      {body}
    </a>
  ) : body;
}
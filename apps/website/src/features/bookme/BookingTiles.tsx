import { useEffect, useState } from 'react';
import { CAL_ENV, makeCalLink } from '@/shared/lib/cal/env';
import { initCalEmbed, updateCalLink } from '@/shared/cal/renderInline';

type Tile = { slug: string; label: string; caption?: string; icon?: string };

interface Props {
  tiles: Tile[];
  initialSlug: string;
}

export default function BookingTiles({ tiles, initialSlug }: Props) {
  const [active, setActive] = useState<string>(initialSlug);

  useEffect(() => {
    if (!active || !tiles?.length) {
      console.warn('[bookme] no tiles/initial slug; skip init');
      return;
    }
    console.debug('[bookme] initCalEmbed', { active });
    initCalEmbed(makeCalLink(CAL_ENV.USERNAME, active));
  }, [active]);

  const onSelect = (slug: string) => {
    setActive(slug);
    console.debug('[bookme] updateCalLink', { slug });
    updateCalLink(makeCalLink(CAL_ENV.USERNAME, slug));
  };

  return (
    <div role="tablist" aria-label="Meeting duration" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {tiles.map((tile) => (
        <button
          key={tile.slug}
          role="tab"
          aria-pressed={active === tile.slug}
          onClick={() => onSelect(tile.slug)}
          className={`rounded-2xl border p-4 text-left shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            active === tile.slug 
              ? 'ring-2 ring-offset-2 ring-[var(--cv-accent)] border-[var(--cv-accent)] bg-[var(--cv-surface-elevated)]' 
              : 'opacity-90 hover:opacity-100 border-[var(--cv-border)] bg-[var(--cv-surface-elevated)] hover:shadow-md'
          }`}
        >
          <div className="flex items-start gap-3">
            {tile.icon && (
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-[var(--cv-muted)]">
                <i className={`${tile.icon} text-lg`}></i>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[var(--cv-foreground)]">{tile.label}</div>
              {tile.caption && (
                <div className="text-sm text-[var(--cv-muted)] mt-1">{tile.caption}</div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

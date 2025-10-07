import { useEffect, useState } from 'react';
import { CAL_ENV } from '@/shared/lib/cal/env';

type Tile = { slug: string; label: string; caption?: string; icon?: string };

interface Props {
  tiles: Tile[];
  initialSlug: string;
}

export default function BookingTiles({ tiles, initialSlug }: Props) {
  const [active, setActive] = useState<string>(initialSlug);
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');

  // Listen for theme changes
  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };

    // Initial theme
    updateTheme();

    // Watch for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Initialize Cal.com embed when component mounts or active changes
  useEffect(() => {
    if (!active || !tiles?.length) return;

    const initializeCal = async () => {
      // Wait for Cal to be available
      const waitForCal = () => {
        return new Promise<void>((resolve) => {
          const check = () => {
            if (window.Cal && typeof window.Cal === 'function') {
              resolve();
            } else {
              setTimeout(check, 50);
            }
          };
          check();
        });
      };

      try {
        await waitForCal();
        
        // Initialize Cal if not already done
        if (window.Cal) {
          window.Cal('init', { origin: 'https://cal.com' });
          
          // Update theme
          window.Cal('ui', { theme });
          
          // Clear existing embed
          const container = document.getElementById('cal-inline');
          if (container) {
            container.innerHTML = '';
            
            // Render new embed
            window.Cal('inline', {
              elementOrSelector: container,
              calLink: `${CAL_ENV.USERNAME}/${active}`,
              config: {
                layout: 'month_view',
                hideEventTypeDetails: false
              }
            });
          }
        }
      } catch (error) {
        console.error('[cal] Failed to initialize embed:', error);
      }
    };

    initializeCal();
  }, [active, theme]);

  const onSelect = (slug: string) => {
    setActive(slug);
    console.debug('[bookme] Selected tile:', { slug });
  };

  return (
    <div className="space-y-6">
      {/* Booking Tiles */}
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

      {/* Cal.com Embed Container */}
      <div 
        id="cal-inline"
        className="cal-inline-wrapper min-h-[540px] rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
        data-cal-link={`${CAL_ENV.USERNAME}/${active}`}
      />
    </div>
  );
}

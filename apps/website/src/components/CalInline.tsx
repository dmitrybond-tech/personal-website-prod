// apps/website/src/components/CalInline.tsx
// React wrapper for Cal.com inline embed with proper lifecycle management

import { useEffect, useRef, useState } from 'react';
import { loadCalEmbed, destroyCalInlineSafe, initCal, updateCalTheme } from '../lib/calLoader';

interface CalInlineProps {
  username: string;
  slug: string;
  layout?: string;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

export default function CalInline({ 
  username, 
  slug, 
  layout = 'month_view', 
  theme = 'auto',
  className = ''
}: CalInlineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlug, setCurrentSlug] = useState(slug);

  // Initialize Cal.com embed
  const initializeEmbed = async () => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Load Cal.com script and initialize
      await loadCalEmbed();
      await initCal();
      
      // Update theme
      updateCalTheme(theme);
      
      // Create fresh container to avoid iframe leftovers
      const container = containerRef.current;
      const freshContainer = document.createElement('div');
      freshContainer.id = container.id;
      freshContainer.className = container.className;
      
      // Copy data attributes
      Array.from(container.attributes).forEach(attr => {
        if (attr.name.startsWith('data-')) {
          freshContainer.setAttribute(attr.name, attr.value);
        }
      });
      
      // Replace container
      container.parentNode?.replaceChild(freshContainer, container);
      containerRef.current = freshContainer;
      
      // Render inline embed
      if (window.Cal && typeof window.Cal === 'function') {
        window.Cal('inline', {
          elementOrSelector: freshContainer,
          calLink: `${username}/${currentSlug}`,
          config: {
            layout,
            hideEventTypeDetails: false
          }
        });
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('[cal] Failed to initialize embed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
      setIsLoading(false);
    }
  };

  // Handle slug changes (re-initialize embed)
  useEffect(() => {
    if (currentSlug !== slug) {
      setCurrentSlug(slug);
      destroyCalInlineSafe();
      initializeEmbed();
    }
  }, [slug]);

  // Handle theme changes
  useEffect(() => {
    updateCalTheme(theme);
  }, [theme]);

  // Initial mount
  useEffect(() => {
    initializeEmbed();
    
    // Cleanup on unmount
    return () => {
      destroyCalInlineSafe();
    };
  }, []);

  if (error) {
    return (
      <div className={`cal-error ${className}`}>
        <p>⚠️ Calendar failed to load</p>
        <p>{error}</p>
        <a 
          href={`https://cal.com/${username}/${currentSlug}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="cal-fallback-link"
        >
          Open Calendar in New Tab
        </a>
      </div>
    );
  }

  return (
    <div className={`cal-inline-container ${className}`}>
      {isLoading && (
        <div className="cal-loading">
          <p>Loading calendar...</p>
        </div>
      )}
      <div 
        ref={containerRef}
        id="cal-inline"
        className="cal-inline-wrapper"
        data-cal-link={`${username}/${currentSlug}`}
        style={{ minHeight: '540px' }}
      />
    </div>
  );
}

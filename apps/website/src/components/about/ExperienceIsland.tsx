import React from 'react';

export type ExperienceItem = {
  company: string;
  role: string;
  dates?: [string, string?];
  location?: string;
  description?: string;
  image?: string;
  stack?: string[];
  bullets?: string[];
  links?: { label: string; url: string; icon?: string }[];
  tagsList?: { title?: string; tags: { name: string }[] };
};

export default function ExperienceIsland({ items = [] }: { items?: ExperienceItem[] }) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateRange = (dates?: [string, string?]) => {
    if (!dates || !dates[0]) return '';
    const start = formatDate(dates[0]);
    const end = dates[1] ? formatDate(dates[1]) : 'Present';
    return `${start} - ${end}`;
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="cv-muted">No experience items to display.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {items.map((item, index) => (
        <article key={index} className="flex items-start gap-3">
          <div className="mt-1 size-3 rounded-full bg-[var(--cv-border)] shrink-0" aria-hidden />
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{item.company}</div>
            <div className="text-sm cv-muted">{item.role}</div>
            <div className="text-xs cv-muted mt-1">
              {item.dates ? formatDateRange(item.dates) : ''}{item.location ? `${item.dates ? ' • ' : ''}${item.location}` : ''}
            </div>
            {item.description && <p className="mt-2 text-sm">{item.description}</p>}
            {Array.isArray(item.bullets) && item.bullets.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
                {item.bullets.map((bullet, bulletIndex) => (
                  <li key={bulletIndex}>{bullet}</li>
                ))}
              </ul>
            )}
            {/* Stack */}
            {item.stack && item.stack.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {item.stack.map((tech, techIndex) => (
                  <span
                    key={techIndex}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium cv-chip"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
            {/* Links */}
            {item.links && item.links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {item.links.map((link, linkIndex) => (
                  <a
                    key={linkIndex}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium cv-chip hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cv-ring"
                  >
                    {link.icon && (
                      <span className="text-sm" aria-hidden="true">
                        {link.icon}
                      </span>
                    )}
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
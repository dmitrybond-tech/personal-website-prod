import React from 'react';

export type EducationItem = {
  institution: string;
  degree: string;
  field?: string;
  dates?: [string, string?];
  description?: string;
  image?: string;
  achievements?: string[];
  gpa?: string;
  location?: string;
};

export default function EducationIsland({ items = [] }: { items?: EducationItem[] }) {
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
        <p className="cv-muted">No education items to display.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {items.map((item, index) => (
        <article key={index} className="flex items-start gap-3">
          <div className="mt-1 size-3 rounded-full bg-[var(--cv-border)] shrink-0" aria-hidden />
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{item.institution}</div>
            {item.degree && <div className="text-sm cv-muted">{item.degree}</div>}
            <div className="text-xs cv-muted mt-1">
              {formatDateRange(item.dates)}{item.location ? ` • ${item.location}` : ''}
            </div>
            {item.description && <p className="mt-2 text-sm">{item.description}</p>}
            {Array.isArray(item.achievements) && item.achievements.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
                {item.achievements.map((achievement, achievementIndex) => (
                  <li key={achievementIndex}>{achievement}</li>
                ))}
              </ul>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
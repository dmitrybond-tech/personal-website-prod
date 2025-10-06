import React from 'react';

export type HeroLink = {
  label: string;
  url: string;
  icon?: string;
};

export type HeroBadge = {
  name: string;
};

export default function HeroIsland({ 
  name, 
  role, 
  avatar, 
  avatarSizePx,
  location, 
  bio, 
  links = [], 
  tags = [],
  contact,
  cvUrl,
  lang = 'en'
}: {
  name?: string;
  role?: string;
  avatar?: string;
  avatarSizePx?: number;
  location?: string;
  bio?: string;
  links?: HeroLink[];
  tags?: string[];
  contact?: { email?: string; phone?: string };
  cvUrl?: string | null;
  lang?: 'en' | 'ru';
}) {
  // Extract social links for header toolbar
  const telegramLink = links.find(link => 
    link.label.toLowerCase().includes('telegram') || 
    link.url.includes('t.me')
  );
  const linkedinLink = links.find(link => 
    link.label.toLowerCase().includes('linkedin') || 
    link.url.includes('linkedin.com')
  );
  const portfolioLink = links.find(link => 
    link.label.toLowerCase().includes('portfolio') || 
    link.label.toLowerCase().includes('website') ||
    (!link.url.includes('t.me') && !link.url.includes('linkedin.com'))
  );

  // Calculate avatar size with safeguards - using fixed 160x240 for vertical scaling
  const avatarWidth = 160;
  const avatarHeight = 240;

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      {/* Avatar with Download CV button */}
      <div className="flex-shrink-0 flex flex-col items-center">
        <div
          className="relative rounded-2xl overflow-hidden border"
          style={{ width: `${avatarWidth}px`, height: `${avatarHeight}px` }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={name ? `${name} profile picture` : 'Profile picture'}
              className="w-full h-full object-cover"
              loading="eager"
              decoding="sync"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-[var(--cv-surface-2)]" />
          )}
        </div>
        
        {/* Download CV button under avatar */}
        {cvUrl && (
          <a 
            href={cvUrl} 
            download 
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl cv-ring w-full justify-center"
            style={{ background: 'var(--cv-accent)', color: 'white' }}
            title={lang === 'ru' ? 'Скачать резюме (PDF)' : 'Download CV (PDF)'}
          >
            <iconify-icon icon="mdi:download" aria-hidden />
            <span>{lang === 'ru' ? 'Резюме' : 'Download CV'}</span>
          </a>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 space-y-4">
        {/* Name, Role, Location with Social Icons */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            {name && (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {name}
              </h1>
            )}
            {role && (
              <p className="text-lg cv-muted mt-1">
                {role}
              </p>
            )}
            {location && (
              <a 
                href="https://www.google.com/maps?q=55.03055266227897,82.92296996190106"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm cv-muted mt-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cv-ring)] rounded-sm inline-block"
              >
                📍 {location}
              </a>
            )}
            {/* Contact row under location */}
            {(contact?.email || contact?.phone) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mt-2">
                {contact?.email && (
                  <a 
                    href={`mailto:${contact.email}`} 
                    className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cv-ring)] rounded-sm"
                  >
                    ✉️ Email: {contact.email}
                  </a>
                )}
                {contact?.phone && (
                  <a 
                    href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} 
                    className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cv-ring)] rounded-sm"
                  >
                    📞 Phone: {contact.phone}
                  </a>
                )}
              </div>
            )}
          </div>
          
          {/* Social Icons Toolbar */}
          <div className="flex items-center gap-3">
            {telegramLink && (
              <a 
                href={telegramLink.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl border cv-chip cv-ring" 
                aria-label="Telegram"
              >
                <iconify-icon icon="mdi:telegram" className="text-[24px] cv-muted" aria-hidden />
              </a>
            )}
            {linkedinLink && (
              <a 
                href={linkedinLink.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl border cv-chip cv-ring" 
                aria-label="LinkedIn"
              >
                <iconify-icon icon="mdi:linkedin" className="text-[24px] cv-muted" aria-hidden />
              </a>
            )}
            {portfolioLink && (
              <a 
                href={portfolioLink.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl border cv-chip cv-ring" 
                aria-label="Portfolio"
              >
                <iconify-icon icon="mdi:link-variant" className="text-[24px] cv-muted" aria-hidden />
              </a>
            )}
          </div>
        </div>
        
        {/* Bio */}
        {bio && (
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {bio}
          </p>
        )}
        
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-2 text-sm rounded-xl border cv-chip"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
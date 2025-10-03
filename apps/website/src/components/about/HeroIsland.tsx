import React from 'react';
import { Icon } from '@iconify/react';

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
  badges = [],
  cvUrl
}: {
  name?: string;
  role?: string;
  avatar?: string;
  avatarSizePx?: number;
  location?: string;
  bio?: string;
  links?: HeroLink[];
  badges?: HeroBadge[];
  cvUrl?: string | null;
}) {
  // Extract social links for header toolbar
  const githubLink = links.find(link => 
    link.label.toLowerCase().includes('github') || 
    link.url.includes('github.com')
  );
  const linkedinLink = links.find(link => 
    link.label.toLowerCase().includes('linkedin') || 
    link.url.includes('linkedin.com')
  );
  const portfolioLink = links.find(link => 
    link.label.toLowerCase().includes('portfolio') || 
    link.label.toLowerCase().includes('website') ||
    (!link.url.includes('github.com') && !link.url.includes('linkedin.com'))
  );

  // Calculate avatar size with safeguards
  const size = Math.max(80, Math.min(512, Number(avatarSizePx ?? 160)));

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      {/* Avatar with Download CV button */}
      <div className="flex-shrink-0 flex flex-col items-center">
        <div
          className="relative rounded-2xl overflow-hidden border"
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={name ? `${name} profile picture` : 'Profile picture'}
              className="w-full h-full object-cover"
              loading="lazy"
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
            className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl cv-ring"
            style={{ background: 'var(--cv-accent)', color: 'white' }}
            title="Download CV (PDF)"
          >
            <Icon icon="mdi:download" aria-hidden />
            <span>Download CV</span>
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
              <p className="text-sm cv-muted mt-1">
                📍 {location}
              </p>
            )}
          </div>
          
          {/* Social Icons Toolbar */}
          <div className="flex items-center gap-2">
            {githubLink && (
              <a 
                href={githubLink.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border cv-chip cv-ring" 
                aria-label="GitHub"
              >
                <Icon icon="mdi:github" className="text-[18px] cv-muted" aria-hidden />
              </a>
            )}
            {linkedinLink && (
              <a 
                href={linkedinLink.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border cv-chip cv-ring" 
                aria-label="LinkedIn"
              >
                <Icon icon="mdi:linkedin" className="text-[18px] cv-muted" aria-hidden />
              </a>
            )}
            {portfolioLink && (
              <a 
                href={portfolioLink.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border cv-chip cv-ring" 
                aria-label="Portfolio"
              >
                <Icon icon="mdi:link-variant" className="text-[18px] cv-muted" aria-hidden />
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
        
        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map((badge, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {badge.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
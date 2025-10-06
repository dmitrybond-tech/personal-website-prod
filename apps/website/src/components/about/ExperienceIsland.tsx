import React from 'react';

type I18nStr = string | { en?: string; ru?: string };

const t = (v: I18nStr) => typeof v === 'string' ? v : (v?.en ?? Object.values(v ?? {})[0] ?? '');

export type ExperienceRole = {
  title: I18nStr;
  period: I18nStr;
  bullets?: I18nStr[];
};

export type ExperienceCompany = {
  company: I18nStr;
  location?: I18nStr;
  url?: string;
  logo?: string;
  roles: ExperienceRole[];
};

export default function ExperienceIsland({ companies = [] }: { companies?: ExperienceCompany[] }) {
  if (companies.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="cv-muted">No experience items to display.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {companies.map((company, companyIndex) => {
        const name = t(company.company);
        const location = company.location ? t(company.location) : '';
        const href = company.url;

        const LogoBox = (
          <div className="size-12 rounded-xl overflow-hidden bg-[var(--cv-surface-2)]">
            {company.logo ? (
              <img 
                src={company.logo} 
                alt="" 
                className="size-full object-cover" 
                loading="lazy" 
              />
            ) : null}
          </div>
        );

        return (
          <article key={companyIndex} className="flex gap-4">
            {/* Logo clickable if url */}
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cv-ring)] rounded-xl"
                aria-label={`Open ${name}`}
                title={name}
              >
                {LogoBox}
              </a>
            ) : (
              <div className="shrink-0">{LogoBox}</div>
            )}

            <div className="min-w-0 flex-1">
              <header className="flex flex-wrap items-baseline gap-x-2">
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold leading-none hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cv-ring)] rounded-sm"
                    title={name}
                  >
                    {name}
                    <span aria-hidden="true" className="ml-1 align-middle opacity-70">↗</span>
                  </a>
                ) : (
                  <h3 className="text-sm font-semibold leading-none">{name}</h3>
                )}
                {location && (
                  <span className="text-xs cv-muted truncate">• {location}</span>
                )}
              </header>

            <div className="mt-2 space-y-3">
              {company.roles.map((role, roleIndex) => (
                <div key={roleIndex}>
                  <div className="text-sm font-medium">{t(role.title)}</div>
                  {role.period && (
                    <div className="text-xs cv-muted mt-0.5">{t(role.period)}</div>
                  )}
                  {Array.isArray(role.bullets) && role.bullets.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-sm space-y-1">
                      {role.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="cv-ring">
                          {t(bullet)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </article>
      );
      })}
    </div>
  );
}
import React from 'react';

type I18nStr = string | { en?: string; ru?: string };
const t = (v: I18nStr) => typeof v === 'string' ? v : (v?.en ?? Object.values(v ?? {})[0] ?? '');

export default function EducationIsland({ institutions = [] }: { institutions: any[] }) {
  if (institutions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="cv-muted">No education items to display.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {institutions.map((inst, i) => {
        const name = t(inst.school);
        const loc  = inst.location ? t(inst.location) : '';
        const href = inst.url;

        const LogoBox = (
          <div className="size-12 rounded-xl overflow-hidden border bg-[var(--cv-surface-2)]">
            {inst.logo ? <img src={inst.logo} alt="" className="size-full object-cover" loading="lazy" /> : null}
          </div>
        );

        return (
          <article key={i} className="flex gap-4">
            {/* Clickable logo if url */}
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
                    <span aria-hidden className="ml-1 align-middle opacity-70">↗</span>
                  </a>
                ) : (
                  <h3 className="text-sm font-semibold leading-none">{name}</h3>
                )}
                {loc && <span className="text-xs cv-muted truncate">• {loc}</span>}
              </header>

              <div className="mt-2 space-y-3">
                {(inst.degrees ?? []).map((d: any, di: number) => (
                  <div key={di}>
                    <div className="text-sm font-medium">
                      {t(d.degree) || t(d.program) || '—'}
                    </div>
                    {/* show program/faculty on next line if both present */}
                    {(d.program || d.faculty) && (
                      <div className="text-sm cv-muted">
                        {[d.program && t(d.program), d.faculty && t(d.faculty)].filter(Boolean).join(' — ')}
                      </div>
                    )}
                    {d.period && <div className="text-xs cv-muted mt-0.5">{t(d.period)}</div>}
                    {Array.isArray(d.bullets) && d.bullets.length > 0 && (
                      <ul className="mt-1 list-disc pl-5 text-sm space-y-1">
                        {d.bullets.map((b: any, bi: number) => <li key={bi}>{t(b)}</li>)}
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
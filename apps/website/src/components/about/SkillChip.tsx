import React from 'react';
import { Icon } from '@iconify/react';

export default function SkillChip({
  name, icon, url, level, description,
}: { name: string; icon?: string; url?: string; level?: 1|2|3|4|5; description?: string }) {
  const chip = "cv-chip rounded-xl border";
  const inner = "px-4 py-3 flex items-center gap-2";
  const iconCls = "text-[18px] cv-muted";

  // Check if icon is an Iconify token (contains ':') or a file path
  const isToken = typeof icon === 'string' && icon.includes(':');

  const body = (
    <div className={chip}>
      <div className={inner}>
        {icon && (
          isToken ? (
            <Icon icon={icon} className={iconCls} aria-hidden />
          ) : (
            <img src={icon} alt="" className={iconCls} loading="lazy" decoding="async" />
          )
        )}
        <span className="text-sm font-medium truncate">{name}</span>
      </div>

      {typeof level === 'number' && (
        <div className="px-4 pb-3">
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`cv-level ${i < level ? 'cv-level--on' : 'cv-level--off'}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return url
    ? <a href={url} className="block rounded-xl cv-ring">{body}</a>
    : body;
}

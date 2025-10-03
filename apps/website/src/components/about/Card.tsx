import React from 'react';
import { Icon } from '@iconify/react';

export type CardProps = {
  id: string;
  name: string;
  title?: string; // fallback for name
  subtitle?: string;
  description?: string;
  icon?: string;
  url?: string;
  tags?: string[];
  level?: 1 | 2 | 3 | 4 | 5;
  tooltip?: string; // for 'skills' variant
  variant?: 'default' | 'skills';
  // Passthrough for any additional fields from CMS
  [key: string]: any;
};

const Card: React.FC<CardProps> = ({
  id,
  name,
  title,
  subtitle,
  description,
  icon,
  url,
  tags,
  level,
  tooltip,
  variant = 'default',
  ...passthrough
}) => {
  const displayTitle = title || name || '';
  const displayDescription = description || tooltip || '';

  const renderSkillLevel = (level = 0) => (
    <div className="grid grid-cols-5 gap-1 mt-2">
      {Array.from({length:5}).map((_,i)=>(
        <div
          key={i}
          className={i < level
            ? 'h-1.5 rounded-sm bg-gray-900 dark:bg-white/90 transition-colors'
            : 'h-1.5 rounded-sm bg-gray-300 dark:bg-gray-700 transition-colors'}
        />
      ))}
    </div>
  );

  if (variant === 'skills') {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
        <div className="flex h-5 gap-2 items-center">
          {icon && <Icon icon={icon} className="text-[18px] opacity-80" aria-hidden />}
          <span className="text-sm font-medium">{displayTitle}</span>
        </div>
        {displayDescription && (
          <div className="relative">
            <button
              aria-describedby={`tooltip-${id}`}
              className="inline-flex items-center justify-center size-4 opacity-70 hover:opacity-100"
            >
              <Icon icon="fa6-solid:circle-info" className="text-[14px]" aria-hidden />
              <span className="sr-only">More info</span>
            </button>
            <div id={`tooltip-${id}`} role="tooltip"
                 className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 rounded-md px-2 py-1 text-xs text-white bg-gray-900 shadow">
              {displayDescription}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"/>
            </div>
          </div>
        )}
        {level && renderSkillLevel(level)}
      </div>
    );
  }

  // Default variant
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {icon && (
          <Icon icon={icon} className="text-blue-500 mt-1 text-[20px]" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {displayTitle}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
          {displayDescription && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {displayDescription}
            </p>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;

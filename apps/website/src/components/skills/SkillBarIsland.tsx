import React from 'react';

export interface SkillBarProps {
  level: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

export default function SkillBarIsland({ level, className = '' }: SkillBarProps) {
  return (
    <div className={`grid grid-cols-5 gap-1 ${className}`}>
      {Array.from({ length: 5 }, (_, index) => {
        const isFilled = index < level;
        return (
          <div
            key={index}
            className={`h-2 rounded-sm transition-colors duration-200 ${
              isFilled
                ? 'bg-blue-500 dark:bg-blue-400'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

export type Card = {
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
  // Passthrough for any additional fields from CMS
  [key: string]: any;
};

export type Props = {
  items: Card[];
  variant?: 'default' | 'skills';
  hydrate?: 'load' | 'visible';
};

const CardGridIsland: React.FC<Props> = ({ items, variant = 'default', hydrate = 'load' }) => {
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);

  useEffect(() => {
    performance.mark('cards:hydrate:start');
    console.debug('[cards] mount items=%d variant=%s', items.length, variant);
    const onLoad=()=>{performance.mark('cards:window:load');
      performance.measure('cards:until-window-load','cards:hydrate:start','cards:window:load');
      const m=performance.getEntriesByName('cards:until-window-load').pop();
      if(m) console.debug('[cards] until-window-load %sms', Math.round(m.duration));
    };
    window.addEventListener('load', onLoad, {once:true});
    const po=new PerformanceObserver(list=>{
      for(const e of list.getEntries()){
        if(e.initiatorType==='css'||e.initiatorType==='font'){
          console.debug('[res]', e.initiatorType, (e as any).name?.split('?')[0]??'', Math.round(e.duration)+'ms');
        }
      }
    });
    try{po.observe({type:'resource', buffered:true});}catch{}
    return()=>{window.removeEventListener('load', onLoad);
      try{po.disconnect();}catch{}
      performance.mark('cards:hydrate:end');
      performance.measure('cards:hydrate','cards:hydrate:start','cards:hydrate:end');
      const m=performance.getEntriesByName('cards:hydrate').pop();
      if(m) console.debug('[cards] hydrate %sms', Math.round(m.duration));
    };
  }, [variant, items.length]);

  // Handle tooltip visibility
  const handleTooltipToggle = (id: string) => {
    setTooltipVisible(tooltipVisible === id ? null : id);
  };

  // Handle ESC key to close tooltip
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTooltipVisible(null);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

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

  const renderCard = (card: Card) => {
    const displayTitle = card.title || card.name || '';
    const displayDescription = card.description || card.tooltip || '';
    
    if (variant === 'skills') {
      return (
        <div key={card.id} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
          <div className="flex h-5 gap-2 items-center">
            {card.icon && <Icon icon={card.icon} className="text-[18px] opacity-80" aria-hidden />}
            <span className="text-sm font-medium">{displayTitle}</span>
          </div>
          {displayDescription && (
            <div className="relative">
              <button
                onClick={() => handleTooltipToggle(card.id)}
                aria-describedby={tooltipVisible === card.id ? `tooltip-${card.id}` : undefined}
                className="inline-flex items-center justify-center size-4 opacity-70 hover:opacity-100"
              >
                <Icon icon="fa6-solid:circle-info" className="text-[14px]" aria-hidden />
                <span className="sr-only">More info</span>
              </button>
              {tooltipVisible === card.id && (
                <div id={`tooltip-${card.id}`} role="tooltip"
                     className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 rounded-md px-2 py-1 text-xs text-white bg-gray-900 shadow">
                  {displayDescription}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"/>
                </div>
              )}
            </div>
          )}
          {card.level && renderSkillLevel(card.level)}
        </div>
      );
    }

    // Default variant
    return (
      <div key={card.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          {card.icon && (
            <Icon icon={card.icon} className="text-blue-500 mt-1 text-[20px]" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {displayTitle}
            </h3>
            {card.subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {card.subtitle}
              </p>
            )}
            {displayDescription && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                {displayDescription}
              </p>
            )}
            {card.tags && card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {card.tags.map((tag, index) => (
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

  // Add empty items warning
  if (!items.length) console.warn('[cards] empty items for variant=%s', variant);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(renderCard)}
    </div>
  );
};

export default CardGridIsland;

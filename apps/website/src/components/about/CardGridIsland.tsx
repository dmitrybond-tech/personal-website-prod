import React, { useState, useEffect } from 'react';
import Card, { CardProps } from './Card';

export type CardGridIslandProps = {
  items: CardProps[];
  variant?: 'default' | 'skills';
  hydrate?: 'load' | 'visible';
};

const CardGridIsland: React.FC<CardGridIslandProps> = ({ 
  items, 
  variant = 'default', 
  hydrate = 'load' 
}) => {
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);

  useEffect(() => {
    performance.mark('cards:hydrate:start');
    console.debug('[cards] mount items=%d variant=%s', items.length, variant);
    
    const onLoad = () => {
      performance.mark('cards:window:load');
      performance.measure('cards:until-window-load','cards:hydrate:start','cards:window:load');
      const m = performance.getEntriesByName('cards:until-window-load').pop();
      if(m) console.debug('[cards] until-window-load %sms', Math.round(m.duration));
    };
    
    window.addEventListener('load', onLoad, {once:true});
    
    const po = new PerformanceObserver(list => {
      for(const e of list.getEntries()){
        if(e.initiatorType === 'css' || e.initiatorType === 'font'){
          console.debug('[res]', e.initiatorType, (e as any).name?.split('?')[0] ?? '', Math.round(e.duration)+'ms');
        }
      }
    });
    
    try{po.observe({type:'resource', buffered:true});}catch{}
    
    return () => {
      window.removeEventListener('load', onLoad);
      try{po.disconnect();}catch{}
      performance.mark('cards:hydrate:end');
      performance.measure('cards:hydrate','cards:hydrate:start','cards:hydrate:end');
      const m = performance.getEntriesByName('cards:hydrate').pop();
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

  // Add empty items warning
  if (!items.length) console.warn('[cards] empty items for variant=%s', variant);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card
          key={item.id}
          {...item}
          variant={variant}
        />
      ))}
    </div>
  );
};

export default CardGridIsland;

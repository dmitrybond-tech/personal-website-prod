// apps/website/src/shared/cal/renderInline.ts
import { applyCalTheme } from './applyCalTheme';

console.debug('[cal] renderInline loaded');

export function renderInline(calLink: string) {
  const host = document.getElementById('cal-inline');
  if (!host) return;
  
  // Чистим предыдущее содержимое, чтобы не плодить iframe'ы
  host.innerHTML = '';
  
  if (typeof window !== 'undefined' && window.Cal) {
    window.Cal('inline', { elementOrSelector: host, calLink });
    // Сразу применяем текущую тему к новому встраиванию
    applyCalTheme();
  }
}

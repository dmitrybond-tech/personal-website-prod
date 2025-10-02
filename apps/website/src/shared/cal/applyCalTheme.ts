// apps/website/src/shared/cal/applyCalTheme.ts
console.debug('[cal] applyCalTheme loaded');

export function applyCalTheme() {
  const root = document.documentElement;
  const isDark =
    root.classList.contains('dark') ||
    root.getAttribute('data-theme') === 'dark';
  
  // Инструкция UI: выставляем тему embed без перезагрузки
  if (typeof window !== 'undefined' && window.Cal) {
    window.Cal('ui', { theme: isDark ? 'dark' : 'light' });
  }
}

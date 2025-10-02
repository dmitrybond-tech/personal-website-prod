export type Theme = 'light' | 'dark';

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function getInitialTheme(): Theme {
  if (!isBrowser()) return 'light';
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  if (!isBrowser()) return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.setAttribute('data-theme', theme);
  try { localStorage.setItem('theme', theme); } catch {}
  // единая точка синхронизации (Cal и т.д.)
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

export function toggleTheme(): Theme {
  const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

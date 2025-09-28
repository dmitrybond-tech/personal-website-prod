import { getInitialTheme, applyTheme, toggleTheme } from '@shared/lib/theme';

function bind() {
  const root = document.documentElement;

  if (!root.hasAttribute('data-theme-initialized')) {
    root.setAttribute('data-theme-initialized', '');
    applyTheme(getInitialTheme());
  }

  const btn = document.getElementById('theme-toggle');
  if (btn && !(btn as HTMLElement).dataset.bound) {
    (btn as HTMLElement).dataset.bound = '1';
    btn.addEventListener('click', () => {
      toggleTheme(); // applyTheme + themechange inside
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bind, { once: true });
} else {
  bind();
}

export type Theme = 'light' | 'dark';

export function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'light';
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  
  const html = document.documentElement;
  
  // Устанавливаем data-theme для CSS переменных
  html.setAttribute('data-theme', theme);
  
  // Устанавливаем класс для Tailwind dark mode
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  
  // Обновляем theme-color meta tag
  const themeMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
  if (themeMeta) {
    themeMeta.content = theme === 'dark' ? '#1a202c' : '#ffffff';
  }
}

export function setTheme(theme: Theme): void {
  applyTheme(theme);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('theme', theme);
  }
}

export function toggleTheme(): Theme {
  const current = getInitialTheme();
  const newTheme = current === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  return newTheme;
}

export function onThemeChange(callback: (theme: Theme) => void): void {
  if (typeof window === 'undefined') return;
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => {
    if (!localStorage.getItem('theme')) {
      const theme = mediaQuery.matches ? 'dark' : 'light';
      callback(theme);
    }
  };
  
  mediaQuery.addEventListener('change', handleChange);
  
  // Возвращаем функцию для отписки
  return () => mediaQuery.removeEventListener('change', handleChange);
}


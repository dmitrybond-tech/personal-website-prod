import { renderInline } from '@shared/cal/renderInline';
import { applyCalTheme } from '@shared/cal/applyCalTheme';

// Применяем тему до первого рендера
applyCalTheme();

// Дефолтный event (если есть константа — импортируй её; иначе оставь строку)
renderInline('dmitrybond/intro-30m');

// Слушаем смену темы
window.addEventListener('themechange', applyCalTheme);

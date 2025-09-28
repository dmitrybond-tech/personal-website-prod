import { renderInline } from '@shared/cal/renderInline';

function initBookingTiles() {
  const tiles = Array.from(document.querySelectorAll('.tile'));

  function setActive(el: Element) {
    tiles.forEach(t => t.classList.remove('active'));
    el.classList.add('active');
  }

  // Делегирование кликов по тайлам с дебаунсом
  let debounceTimer: number | null = null;
  
  document.addEventListener('click', (e) => {
    const btn = (e.target instanceof Element) ? e.target.closest('[data-cal-link]') : null;
    if (!btn) return;
    
    const link = btn.getAttribute('data-cal-link');
    if (!link) return;
    
    e.preventDefault();
    
    // Дебаунс для предотвращения повторных инициализаций
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(() => {
      setActive(btn);
      renderInline(link);
      
      // Мягкий скролл к виджету
      const sec = document.getElementById('cal-section');
      sec && sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Обновим адресную строку (без перезагрузки)
      history.replaceState(null, '', `${location.pathname}?cal=${encodeURIComponent(link)}`);
    }, 100);
  }, { passive: true });

  // Активируем по умолчанию «Интервью»
  const def = document.querySelector('.tile-2-интервью');
  def && def.classList.add('active');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBookingTiles, { once: true });
} else {
  initBookingTiles();
}

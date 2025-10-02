// apps/website/src/app/shared/lib/cal/embed.ts
import { calEmbedConfig, CalLocale, BookingType } from '@shared/config/cal/config';

declare global {
  interface Window { Cal?: any }
}

let calScriptInjected = false;
let calBootstrapped = false;
let mounted = false;
let currentType: BookingType = 'interview';
let currentLocale: CalLocale = calEmbedConfig.defaultLocale;

function injectCalLoader(src: string) {
  if (calScriptInjected) return;
  const s = document.createElement('script');
  s.src = src;
  s.async = true;
  document.head.appendChild(s);
  calScriptInjected = true;
}

// Cal global wrapper (однократно)
function bootstrapCal() {
  if (calBootstrapped) return;
  (function (C: any, A: string, L: string) {
    const d = document;
    C.Cal = C.Cal || function () {
      const cal = C.Cal, args = arguments as IArguments;
      if (!cal.loaded) {
        cal.ns = {}; cal.q = cal.q || [];
        d.head.appendChild(d.createElement('script')).src = A;
        cal.loaded = true;
      }
      if (args[0] === L) {
        const api: any = function () { (api.q = api.q || []).push(arguments); };
        const namespace = args[1];
        if (typeof namespace === 'string') {
          cal.ns[namespace] = api;
          (api.q = api.q || []).push(args);
          (cal.q = cal.q || []).push(['initNamespace', namespace]);
        } else { (cal.q = cal.q || []).push(args); }
        return;
      }
      (cal.q = cal.q || []).push(args);
    };
  })(window, 'https://app.cal.com/embed/embed.js', 'init');
  calBootstrapped = true;
}

function pickBrandColor(): string | undefined {
  const { branding, themeSync } = calEmbedConfig.ui;
  if (!themeSync) return branding?.brandColor;
  const v = getComputedStyle(document.documentElement).getPropertyValue('--brand-color')?.trim();
  return v || branding?.brandColor;
}

function getCalLink(locale: CalLocale, type: BookingType): string {
  return calEmbedConfig.linksByType[type][locale] || calEmbedConfig.linksByType[type][calEmbedConfig.defaultLocale];
}

function clearContainer(selector: string) {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = '';
}

function applyUI(locale: CalLocale) {
  const language = calEmbedConfig.localeMap[locale] ?? calEmbedConfig.localeMap[calEmbedConfig.defaultLocale];
  const ui: any = {
    styles: { branding: { brandColor: pickBrandColor() } },
    hideEventTypeDetails: calEmbedConfig.ui.hideEventTypeDetails,
    layout: calEmbedConfig.ui.layout,
  };
  if (calEmbedConfig.ui.forceLanguage && language) {
    ui.language = language; // если Cal поддерживает language/locale — пробросим
  }
  window.Cal('ui', ui);
}

async function mountInline(locale: CalLocale, type: BookingType) {
  if (typeof window === 'undefined') return;
  const sel = calEmbedConfig.behavior.selector;
  const el = document.querySelector(sel);
  if (!el) {
    console.warn('[cal-embed] container not found:', sel);
    return;
  }

  injectCalLoader('https://app.cal.com/embed/embed.js');
  bootstrapCal();
  window.Cal('init', { origin: calEmbedConfig.origin });
  applyUI(locale);

  clearContainer(sel);
  window.Cal('inline', {
    elementOrSelector: sel,
    calLink: getCalLink(locale, type),
  });

  mounted = true;
}

function observeAndMountIfNeeded(locale: CalLocale, type: BookingType) {
  const sel = calEmbedConfig.behavior.selector;
  const el = document.querySelector(sel);
  if (!el) return;

  const doMount = () => mountInline(locale, type);

  if (calEmbedConfig.behavior.lazy && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        doMount();
        io.disconnect();
      }
    }, { threshold: calEmbedConfig.behavior.threshold });
    io.observe(el);
  } else {
    doMount();
  }
}

export function initCalEmbed(locale?: CalLocale, initialType: BookingType = 'interview') {
  if (typeof window === 'undefined') return; // SSR guard
  currentLocale = (locale || calEmbedConfig.defaultLocale);
  currentType = initialType;
  observeAndMountIfNeeded(currentLocale, currentType);
}

export async function setCalType(type: BookingType) {
  currentType = type;
  // Если ещё не смонтировано (лениво), смонтируем сразу:
  if (!mounted) {
    await mountInline(currentLocale, currentType);
  } else {
    // Перемонтируем с новым calLink
    await mountInline(currentLocale, currentType);
  }

  if (calEmbedConfig.behavior.scrollIntoViewOnSelect) {
    const el = document.querySelector(calEmbedConfig.behavior.selector);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

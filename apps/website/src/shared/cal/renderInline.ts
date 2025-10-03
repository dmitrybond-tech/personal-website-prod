let assetsLoaded = false;
let current = '';
let usingIframe = false;

function ensureCalStub() {
  // define stub on both window and globalThis BEFORE script loads
  const g: any = (globalThis as any);
  const w: any = (window as any);
  if (!g.Cal) {
    const stub = function(){ (stub as any).q = (stub as any).q || []; (stub as any).q.push(arguments); };
    g.Cal = stub;
  }
  if (!w.Cal) w.Cal = g.Cal;
}

function injectOnce(tag: 'link'|'script', attrs: Record<string,string>, onload?: () => void, onerror?: () => void) {
  const key = tag === 'link' ? attrs.href : attrs.src;
  if (!key) return;
  if (document.querySelector(`${tag}[data-cal-asset="${key}"]`)) return onload?.();
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v));
  el.setAttribute('data-cal-asset', key);
  if (onload) el.addEventListener('load', onload, { once: true });
  if (onerror) el.addEventListener('error', onerror, { once: true });
  document.head.appendChild(el);
}

async function ensureCalAssets(): Promise<void> {
  if (assetsLoaded) return;
  // CSS primary: cal.com; only if it fails, inject app.cal.com to avoid 404 noise
  await new Promise<void>((resolve) => {
    injectOnce('link', { rel: 'stylesheet', href: 'https://cal.com/embed.css' }, resolve, () => {
      injectOnce('link', { rel: 'stylesheet', href: 'https://app.cal.com/embed/embed.css' }, resolve, resolve);
    });
  });

  // 2) Script: prefer cal.com, fallback to app.cal.com
  ensureCalStub();
  await new Promise<void>((resolve) => {
    injectOnce('script', {
      src: 'https://cal.com/embed.js',
      async: 'true'
    }, resolve, () => {
      injectOnce('script', {
        src: 'https://app.cal.com/embed/embed.js',
        async: 'true'
      }, resolve, resolve);
    });
  });
  // @ts-ignore — stub or real
  (window as any).Cal('init', { origin: 'https://cal.com' });
  assetsLoaded = true;
}

function htmlTheme(): 'light'|'dark' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function brandColor(): string | undefined {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--brand-color')?.trim();
  return v || undefined;
}

function mountIframe(calLink: string) {
  usingIframe = true;
  const host = document.querySelector('.calendar-placeholder') as HTMLElement | null;
  if (!host) return;
  host.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Cal booking');
  const theme = htmlTheme();
  iframe.src = `https://cal.com/${calLink}?embed=true&layout=week_view&theme=${theme}`;
  iframe.style.width = '100%';
  iframe.style.minHeight = '630px';
  iframe.style.border = '0';
  iframe.loading = 'lazy';
  host.appendChild(iframe);
}

function mount(calLink: string) {
  const host = document.querySelector('.calendar-placeholder') as HTMLElement | null;
  if (!host) {
    console.warn('[cal] .calendar-placeholder not found; skip mount');
    return;
  }
  host.innerHTML = '';
  // @ts-ignore
  const Cal = (window as any).Cal;
  if (typeof Cal !== 'function') {
    console.error('[cal] Cal global missing; fallback to iframe');
    mountIframe(calLink);
    return;
  }
  const styles = { branding: {} as Record<string, string> };
  const bc = brandColor();
  if (bc) styles.branding!.brandColor = bc;
  Cal('inline', {
    elementOrSelector: host,
    calLink,
    layout: 'week_view',
    theme: htmlTheme(),
    styles // always pass an object to avoid "Cannot convert undefined or null to object"
  });
}

export async function initCalEmbed(calLink: string) {
  current = calLink;
  await ensureCalAssets();
  // try script-based mount; if DOM stays empty, fallback to iframe
  mount(current);
  if (!usingIframe) {
    setTimeout(() => {
      const hasChild = (document.querySelector('.calendar-placeholder') as HTMLElement | null)?.childElementCount || 0;
      if (hasChild === 0) {
        console.warn('[cal] inline mount produced no DOM; fallback to iframe');
        mountIframe(current);
      }
    }, 150);
  }
  const mo = new MutationObserver(() => usingIframe ? mountIframe(current) : mount(current));
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

export function updateCalLink(calLink: string) {
  current = calLink;
  if (usingIframe) {
    const host = document.querySelector('.calendar-placeholder') as HTMLElement | null;
    const iframe = host?.querySelector('iframe') as HTMLIFrameElement | null;
    if (iframe) {
      const theme = htmlTheme();
      iframe.src = `https://cal.com/${calLink}?embed=true&layout=week_view&theme=${theme}`;
    } else {
      mountIframe(current);
    }
  } else {
    mount(current);
  }
}
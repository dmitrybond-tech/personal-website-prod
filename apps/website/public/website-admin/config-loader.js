// /public/website-admin/config-loader.js

// Hard block any attempts to fetch default config.yml
(function hardBlockDefaultConfig() {
  const orig = window.fetch;
  window.fetch = function(url, opts) {
    try {
      const str = typeof url === 'string' ? url : (url?.url || '');
      // блокируем любые попытки трогать default config.yml
      if (str.includes('/website-admin/config.yml') || str.includes('/api/website-admin/config.yml')) {
        console.warn('[cms] Blocked fetch to default config.yml:', str);
        return Promise.resolve(new Response('', { status: 404 }));
      }
    } catch {}
    return orig.apply(this, arguments);
  };
})();

const qs = new URLSearchParams(location.search);
const param = qs.get('config');

// Force load only generated config
const FORCE_CONFIG_PATH = '/website-admin/config.generated.yml';

async function fileExists(url) {
  try {
    const r = await fetch(url + (url.includes('?') ? '&' : '?') + 'ping=' + Date.now(), { cache: 'no-store' });
    return r.ok;
  } catch { return false; }
}

async function resolvePath() {
  // If param is explicitly set, use it (but still block if it's config.yml)
  if (param && param !== '/website-admin/config.yml') return param;
  
  // Always prefer generated config
  if (await fileExists(FORCE_CONFIG_PATH)) return FORCE_CONFIG_PATH;
  
  console.warn('[cms] Generated config not found, falling back to force path');
  return FORCE_CONFIG_PATH;
}

async function loadYaml(url) {
  const res = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Config fetch failed: ' + url);
  const text = await res.text();
  return window.jsyaml.load(text);
}

function waitForCMS(timeoutMs = 10000, stepMs = 50) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const id = setInterval(() => {
      if (window.CMS && typeof window.CMS.init === 'function') {
        clearInterval(id); resolve();
      } else if (Date.now() - t0 > timeoutMs) {
        clearInterval(id); reject(new Error('CMS not loaded in time'));
      }
    }, stepMs);
  });
}

function ensureLocalBackend(cfg) {
  const qs = new URLSearchParams(location.search);
  const forceLocal = qs.get('local_backend') === 'true'; // включаем ТОЛЬКО по параметру
  if (forceLocal) {
    const def = { url: 'http://localhost:8081', allowed_hosts: ['localhost:4321'] };
    if (cfg.local_backend === true) cfg.local_backend = def;
    else if (!cfg.local_backend) cfg.local_backend = def;
  } else {
    delete cfg.local_backend; // прод-режим/туннель → без локального бэкенда
  }
  return cfg;
}

(async () => {
  try {
    const path = await resolvePath();
    if (!path) { 
      console.error('[cms] No valid config path found'); 
      return; 
    }
    
    const cfg = ensureLocalBackend(await loadYaml(path));
    window.__CMS_CONFIG_PATH__ = path;
    window.__CMS_CONFIG__ = cfg;
    console.info('[cms] Loaded config from', path, cfg);

    await waitForCMS();
    
    // Initialize CMS without auto-loading default config file
    window.CMS.init({
      load_config_file: false,
      config: cfg,
    });

    setTimeout(() => {
      try {
        const storeCfg = window.__DECAP_CMS__?.state?.config?.toJS?.()
          || window.__DECAP_CMS__?.state?.config;
        console.info('[cms] Store config snapshot:', storeCfg);
        const cols = storeCfg?.collections?.map?.(c => c.name) || [];
        console.info('[cms] Collections:', cols);
      } catch (e) {
        console.warn('[cms] Unable to read store config:', e);
      }
    }, 500);
  } catch (e) {
    console.error('[cms] init failed:', e);
  }
})();
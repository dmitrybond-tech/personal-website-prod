// /public/website-admin/config-loader.js
const qs = new URLSearchParams(location.search);
const param = qs.get('config');

const candidates = [
  '/website-admin/config.generated.yml',
  '/admin/config.generated.yml',
  '/admin/config.yml',
];

async function fileExists(url) {
  try {
    const r = await fetch(url + (url.includes('?') ? '&' : '?') + 'ping=' + Date.now(), { cache: 'no-store' });
    return r.ok;
  } catch { return false; }
}

async function resolvePath() {
  if (param) return param;
  for (const p of candidates) if (await fileExists(p)) return p;
  return null;
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
  const def = { url: 'http://localhost:8081', allowed_hosts: ['localhost:4321'] };
  if (cfg.local_backend === true) cfg.local_backend = def;
  else if (!cfg.local_backend) cfg.local_backend = def;
  return cfg;
}

(async () => {
  try {
    const path = await resolvePath();
    if (!path) { console.warn('[cms] No config found among candidates:', candidates); return; }
    const cfg = ensureLocalBackend(await loadYaml(path));
    window.__CMS_CONFIG_PATH__ = path;
    window.__CMS_CONFIG__ = cfg;
    console.info('[cms] Loaded config from', path, cfg);

    await waitForCMS();
    window.CMS.init({ config: cfg });

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
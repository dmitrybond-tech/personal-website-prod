# Unified Diff - CMS Admin Page Fix

## Summary
Fixed blank CMS admin page by rebuilding `/website-admin` as a minimal Astro page with robust fallbacks and diagnostics.

## Files Changed

### 1. apps/website/src/pages/website-admin/index.astro (NEW)
```diff
+---
+/* No frontmatter */
+---
+<div class="boot" style="font:14px ui-sans-serif,system-ui;padding:16px 20px;line-height:1.4">
+  <div><strong>CDN:</strong> <span id="cdn" style="opacity:.6;border:1px solid #e5e7eb;border-radius:6px;padding:2px 6px">pending</span></div>
+  <div><strong>CMS:</strong> <span id="cms" style="opacity:.6;border:1px solid #e5e7eb;border-radius:6px;padding:2px 6px">pending</span></div>
+  <div><strong>Proxy:</strong> <span id="proxy" style="opacity:.6;border:1px solid #e5e7eb;border-radius:6px;padding:2px 6px">pending</span></div>
+  <pre id="log" style="margin-top:12px;white-space:pre-wrap;word-break:break-word;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px;max-height:240px;overflow:auto"></pre>
+</div>
+
+<script>
+  // 1) Diagnostics helpers
+  const setTag = (id, text, ok=null) => {
+    const el = document.getElementById(id);
+    if (!el) return;
+    el.textContent = text;
+    el.style.opacity = ok===null ? ".6" : "1";
+    el.style.color = ok===false ? "#b91c1c" : "";
+  };
+  const log = (...args) => {
+    const el = document.getElementById("log");
+    if (el) el.textContent += args.map(String).join(" ") + "\n";
+    console.log(...args);
+  };
+  window.addEventListener("error", e => log("[onerror]", e.message || e.error || e));
+  window.addEventListener("unhandledrejection", e => log("[unhandledrejection]", e.reason || e));
+
+  // 2) CMS config (manual init)
+  window.CMS_MANUAL_INIT = true;
+  const CMS_CONFIG = {
+    backend: { name: "github", repo: "dima-bond-git/personal-website", branch: "main" },
+    local_backend: true,
+    media_folder: "apps/website/public/uploads",
+    public_folder: "/uploads",
+    collections: [
+      { name:"pages", label:"Pages", folder:"apps/website/src/content/pages", create:true, format:"frontmatter", extension:"md",
+        fields:[
+          { label:"Title", name:"title", widget:"string" },
+          { label:"Language", name:"lang", widget:"select", options:["en","ru"] },
+          { label:"Route", name:"route", widget:"string", hint:"/en/about or /ru/about" },
+          { label:"Updated At", name:"updatedAt", widget:"datetime", required:false },
+          { label:"Summary", name:"summary", widget:"text", required:false },
+          { label:"Body", name:"body", widget:"markdown" }
+        ] },
+      { name:"blog", label:"Blog", folder:"apps/website/src/content/blog", create:true, format:"frontmatter", extension:"md",
+        fields:[
+          { label:"Title", name:"title", widget:"string" },
+          { label:"Language", name:"lang", widget:"select", options:["en","ru"] },
+          { label:"Published At", name:"publishedAt", widget:"datetime" },
+          { label:"Tags", name:"tags", widget:"list", required:false },
+          { label:"Summary", name:"summary", widget:"text", required:false },
+          { label:"Body", name:"body", widget:"markdown" }
+        ] },
+      { name:"legal", label:"Legal", folder:"apps/website/src/content/legal", create:true, format:"frontmatter", extension:"md",
+        fields:[
+          { label:"Title", name:"title", widget:"string" },
+          { label:"Language", name:"lang", widget:"select", options:["en","ru"] },
+          { label:"Updated At", name:"updatedAt", widget:"datetime" },
+          { label:"Summary", name:"summary", widget:"text", required:false },
+          { label:"Body", name:"body", widget:"markdown" }
+        ] }
+    ]
+  };
+
+  // 3) Load Decap with fallbacks: unpkg -> jsDelivr -> local npm
+  async function loadDecap() {
+    setTag("cdn","loading unpkg…");
+    const urls = [
+      "https://unpkg.com/decap-cms@3.8.3/dist/decap-cms.js",
+      "https://cdn.jsdelivr.net/npm/decap-cms@3.8.3/dist/decap-cms.js"
+    ];
+    for (const url of urls) {
+      try {
+        await new Promise((resolve, reject) => {
+          const s = document.createElement("script");
+          s.src = url; s.async = true;
+          s.onload = resolve; s.onerror = reject;
+          document.head.appendChild(s);
+        });
+        setTag("cdn","loaded: "+url, true);
+        return true;
+      } catch (e) {
+        log("[cdn]", "failed:", url, e);
+      }
+    }
+    // Local npm fallback
+    try {
+      setTag("cdn","loading local npm…");
+      // Vite will serve from node_modules
+      await import("/node_modules/decap-cms/dist/decap-cms.js");
+      setTag("cdn","loaded: local npm", true);
+      return true;
+    } catch (e) {
+      setTag("cdn","failed", false);
+      log("[cdn]", "local fallback failed:", e);
+      return false;
+    }
+  }
+
+  function tryCMSInit() {
+    const CMS = window.CMS || window.DecapCms || window.NetlifyCms;
+    if (!CMS || typeof CMS.init !== "function") {
+      setTag("cms","not loaded", false);
+      return false;
+    }
+    try {
+      setTag("cms","initializing…");
+      CMS.init({ config: CMS_CONFIG });
+      setTag("cms","ready", true);
+      return true;
+    } catch (e) {
+      setTag("cms","init error", false);
+      log("[cms]", e);
+      return false;
+    }
+  }
+
+  async function checkProxy() {
+    try {
+      const res = await fetch("http://localhost:8081/api/v1", { method:"GET" });
+      setTag("proxy", res.ok ? "ok" : ("status "+res.status), res.ok);
+    } catch (e) {
+      setTag("proxy","error", false);
+      log("[proxy]", e);
+    }
+  }
+
+  (async function boot() {
+    const ok = await loadDecap();
+    if (ok) tryCMSInit();
+    checkProxy();
+  })();
+</script>
```

### 2. apps/website/src/pages/website-admin.astro (NEW)
```diff
+---
+Astro.redirect('/website-admin/');
+---
```

### 3. apps/website/DEV_SETUP.md (MODIFIED)
```diff
@@ -125,6 +125,10 @@ Terminal B:
 ```powershell
 cd apps/website
 npx decap-server
-# if it fails:
-npx netlify-cms-proxy-server@1.3.0
-```
+```
+
+### CMS Admin Access
+1. Open `http://localhost:<actual-port>/website-admin` (check console for actual port)
+2. The page shows diagnostics: CDN, CMS, Proxy status
+3. If CDN fails, it automatically tries jsDelivr, then local npm fallback
+4. Check diagnostics line for any errors
```

### 4. apps/website/package.json (MODIFIED)
```diff
+  "devDependencies": {
+    "decap-cms": "^3.8.3",
+    ...
+  }
```

## Key Features

1. **Body-only markup**: Avoids document collisions with Decap CMS
2. **Robust fallback loading**: unpkg → jsDelivr → local npm
3. **Real-time diagnostics**: CDN, CMS, Proxy status indicators
4. **Error logging**: Captures and displays errors in diagnostics panel
5. **Manual CMS init**: Prevents automatic initialization conflicts
6. **Trailing slash redirect**: Ensures consistent URL routing

## Dependencies Added
- `decap-cms@3.8.3` (dev dependency for local fallback)
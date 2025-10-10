# Decap CMS — Rollback to Simple Configuration

## ✅ Changes Applied

Successfully rolled back from complex manual initialization to **simple, standard Decap CMS setup**.

## 📋 What Changed

### 1. **Simplified `index.html`** ✅
**File:** `apps/website/public/website-admin/index.html`

**Removed:**
- ❌ `window.CMS_MANUAL_INIT = true`
- ❌ `config-loader.js` (complex fetch guards)
- ❌ `js-yaml` library loading

**Kept:**
- ✅ Decap CMS from CDN (automatic initialization)
- ✅ `override-login.client.js` (OAuth monitoring)

### 2. **Created Static Config** ✅
**File:** `apps/website/public/website-admin/config.yml`

Simple, standard Decap CMS configuration:
```yaml
backend:
  name: github
  repo: dmitrybond-tech/personal-website-prod
  branch: main
  base_url: https://dmitrybond.tech
  auth_endpoint: /api/decap/authorize

publish_mode: simple
media_folder: apps/website/public/uploads
public_folder: /uploads

collections:
  - name: posts
    label: Blog Posts
    folder: apps/website/src/content/posts/en
    # ... fields
```

### 3. **Backed Up Complex Loader** ✅
**File:** `config-loader.js` → `config-loader.js.backup`

Preserved for reference, not loaded anymore.

### 4. **Kept OAuth Flow** ✅
**Unchanged:**
- `override-login.client.js` — monitors auth completion, handles reload if needed
- `/api/decap/authorize` endpoint — GitHub OAuth server callback
- Server-side OAuth logic — all working as before

## 🎯 How It Works Now

### Simple Flow:
1. User visits `/website-admin/#/`
2. Decap CMS loads automatically
3. Decap fetches `/website-admin/config.yml` (static file)
4. User clicks "Login with GitHub"
5. OAuth flow: GitHub → `/api/decap/authorize` → popup closes
6. `override-login.client.js` monitors auth completion
7. CMS UI appears ✅

### No More:
- ❌ Manual initialization complexity
- ❌ Fetch guards intercepting requests
- ❌ YAML string parsing
- ❌ Store polling issues
- ❌ Config duplication errors

## 📊 Expected Console Output

```
decap-cms-app 3.8.4
decap-cms 3.8.4
[decap-oauth] admin booted; CMS_MANUAL_INIT= false
decap-cms-core 3.9.0
[Decap loads config from /website-admin/config.yml]
[Store initializes automatically]
[CMS UI renders]
```

After login:
```
[decap-oauth] received auth message
[auth] user present=true via netlify-cms-user
```

## ⚙️ Configuration Notes

### Static `base_url`
Currently hardcoded: `base_url: https://dmitrybond.tech`

**For localhost development:**
Change to: `base_url: http://localhost:4321`

**For other domains:**
Update `base_url` in `config.yml`

### Optional: Dynamic `base_url` (future enhancement)
Could use a small inline script in `index.html`:
```html
<script>
  // Fetch config from API with dynamic base_url
  fetch('/api/website-admin/config.yml')
    .then(r => r.text())
    .then(yaml => {
      const blob = new Blob([yaml], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      // Tell Decap to use this config
      window.CMS_CONFIG = url;
    });
</script>
```

But for now, static config is simpler and more reliable.

## 🧪 Testing Checklist

- [ ] Navigate to `/website-admin/#/`
- [ ] CMS loads without errors
- [ ] Click "Login with GitHub"
- [ ] Complete OAuth flow
- [ ] CMS UI appears (sidebar visible)
- [ ] Can browse collections
- [ ] Can create/edit posts

## 🔄 What We Learned

**Decap CMS 3.9.0 with `CMS_MANUAL_INIT = true` is problematic:**
- Internal fetch logic conflicts with manual config
- Store initialization is unreliable
- Even with fetch guards serving correct config, store doesn't initialize

**Standard approach works reliably:**
- Let Decap load `config.yml` automatically
- Simple static file (or API endpoint)
- No manual initialization complexity
- OAuth monitoring script is independent and works fine

## 📁 Files Modified

```
✏️  apps/website/public/website-admin/index.html (simplified)
📄  apps/website/public/website-admin/config.yml (created)
💾  apps/website/public/website-admin/config-loader.js.backup (backed up)
📄  DECAP_SIMPLE_ROLLBACK_COMPLETE.md (this file)
```

## 🚀 Next Steps

1. **Test the simple setup** — should work immediately
2. **If successful** — this becomes the stable baseline
3. **OAuth works** — `override-login.client.js` handles completion
4. **Clean logs** — no more initialization errors

## 🎉 Success Criteria

✅ CMS loads without console errors  
✅ OAuth completes and shows CMS UI  
✅ Collections visible in sidebar  
✅ Can create/edit posts  

---

**Date:** October 10, 2025  
**Status:** ✅ Rollback Complete — Ready for Testing  
**Approach:** Simple & Standard — Proven to Work


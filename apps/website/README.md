# Website

## Local OAuth Test

For stable local testing, the app runs on a fixed origin: `http://localhost:4321`

### GitHub OAuth App Callbacks

Two distinct GitHub OAuth Apps are required:

- **Auth.js callback**: `http://localhost:4321/api/auth/callback/github`
- **Decap callback**: `http://localhost:4321/oauth/callback`

Populate `AUTHJS_*` for Auth.js and `DECAP_*` for Decap.

After switching creds, clear cookies and verify in DevTools → Network that each `/login/oauth/authorize` uses the correct client_id for its corresponding redirect_uri.

### Commands

```bash
cd apps/website
npm run port:kill:4321
npm run dev:local
```

### Testing Steps

1. Visit `http://localhost:4321/api/auth/csrf` - should return a token and set CSRF cookie
2. Visit `http://localhost:4321/api/auth/signin` - should show GitHub sign-in without "redirect_uri is not associated" error
3. After sign-in, visit `http://localhost:4321/api/auth/session` - should show valid session
4. Visit `http://localhost:4321/website-admin` - should redirect to sign-in if needed, then load Decap

### Two OAuth Apps & ASCII-only URLs

**Callbacks:**
- Auth.js → `http://localhost:4321/api/auth/callback/github`
- Decap → `http://localhost:4321/oauth/callback`

**Environment Requirements:**
- `.env.local` must use ASCII-only URLs (no emojis, quotes, or non-ASCII characters)
- Use single origin: `http://localhost:4321`
- Port 4321 is fixed and enforced (no auto-switch to 4322/4323)

### Notes

- Clear cookies for `http://localhost:4321` when switching origins
- The app is configured to never auto-increment to port 4322
- All OAuth routes (`/api/auth/*` and `/oauth*`) are excluded from middleware protection
- Non-ASCII characters in URL environment variables will cause startup failures to prevent ByteString errors

### i18n Admin Configuration

With i18n enabled (`prefixDefaultLocale: true`), the admin UI can be accessed at locale-prefixed routes like `/en/website-admin` or `/ru/website-admin`. 

**Config Loading Fix:** Admin UI now uses a custom `public/website-admin/index.html` with `window.CMS_MANUAL_INIT` and absolute `CMS_CONFIG_PATH = '/website-admin/config.yml'`.

**Admin Root Redirect:** After authentication, admin root requests (`/website-admin` or `/<locale>/website-admin`) are redirected to the static `/website-admin/index.html` file to ensure Decap always uses the manual-init configuration instead of the integration's SSR admin route.

Middleware redirects `/<locale>/website-admin/config.yml` → `/website-admin/config.yml` to support i18n-prefixed paths during XHR.

OAuth endpoints remain `/oauth` (no changes).

**Requirements:**
- The config file must be located at `public/website-admin/config.yml`
- The file will be served at the absolute path `/website-admin/config.yml`
- No locale duplication of the config file is needed
- Admin root redirects only apply to authenticated users accessing admin routes
- Unauthenticated users hitting `/website-admin` still get redirected to `/api/auth/signin`

### Content Management

Content lives under `content/pages/{locale}` and `content/posts/{locale}`.

To enable editorial workflow (PR-based publishing instead of direct push), uncomment `publish_mode: editorial_workflow` in the Decap config.

In Astro projects, content can be connected later through Content Collections and routing - the current goal is only to get the admin panel running.

### Decap v3 i18n Limitations

**Important:** Decap v3 has specific limitations for i18n configuration:

- **List widgets** only support `i18n: true` (or omit the key entirely)
- **List widgets do NOT support** `i18n: duplicate` - this will cause validation errors
- **Sub-field i18n is ignored** for list widgets
- **Datetime widgets** support `i18n: duplicate` for shared dates across locales

See the [Decap i18n documentation](https://decapcms.org/docs/i18n/) for complete details on supported i18n configurations.
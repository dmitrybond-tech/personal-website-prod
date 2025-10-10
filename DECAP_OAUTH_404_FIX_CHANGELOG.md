# Decap CMS GitHub OAuth — 404 Fix, Config Lock, and Popup Login Finalization

## Numbered Changelog

1. **Created `/api/decap/authorize.ts` compatibility endpoint** — 302 redirects to `/api/decap/oauth/authorize` preserving query params; eliminates 404 errors when Decap CMS requests `/api/decap/authorize`.

2. **Created `/api/decap/callback.ts` compatibility endpoint** — 302 redirects to `/api/decap/oauth/callback` preserving code, state, and error params; provides dual-route support for OAuth callback flow.

3. **Locked `auth_endpoint` in `config.yml.ts` to `/api/decap/authorize`** — Changed from `/api/decap/oauth` to flat `/api/decap/authorize` structure; ensures consistent OAuth endpoint configuration across all environments.

4. **Added `authEndpoint` constant in config generation** — Introduced explicit constant for auth endpoint value with inline documentation explaining dual-route support.

5. **Fixed variable shadowing in config logging** — Renamed logging variable from `authEndpoint` to `resolvedAuthEndpoint` to avoid shadowing the config constant; maintains accurate diagnostic output.

6. **Added diagnostic logging for OAuth endpoint resolution** — Server now logs resolved `base_url` and `auth_endpoint` on each config request; aids in production debugging and verification.

7. **Set `Cache-Control: no-store` on compatibility endpoints** — Ensures OAuth redirect responses are never cached by browsers or proxies.

8. **Verified authorize endpoint cookie policy** — Confirmed state cookie uses `httpOnly: true`, `sameSite: 'none'`, `secure: production`, `path: '/'`, `maxAge: 600` (10 min); correct for popup cross-site flow.

9. **Verified callback endpoint HTML response** — Confirmed callback returns HTML with postMessage script that sends `authorization:github:success:` + JSON payload, posts to `window.opener`, stores backup in localStorage, and closes popup after 100ms delay.

10. **Verified callback clears state cookie** — Confirmed callback response includes `Set-Cookie` header with `maxAge: 0` to clear `decap_oauth_state` cookie after successful authentication.

11. **Verified client initialization is deterministic** — Confirmed `config-loader.js` fetches `/api/website-admin/config.yml`, parses YAML, and calls `CMS.init({ load_config_file: false, config })` once before user interaction.

12. **Verified passive diagnostic listener** — Confirmed `override-login.client.js` only logs auth messages without intercepting or transforming them; Decap's native handler processes messages.

13. **Verified no legacy redirect/new-tab code remains** — Confirmed no references to `decap_auth_token` cookie, `auth_success`/`auth_error` query params, or manual popup bridge logic exist in codebase.

## Summary

The 404 error on `/api/decap/authorize` has been eliminated by creating compatibility routes that redirect to the canonical OAuth handlers under `/api/decap/oauth/`. The dynamic config is now locked to use `/api/decap/authorize` as the auth endpoint, providing a stable, predictable configuration. The existing popup flow implementation (postMessage + auto-close) remains intact and correct. No cleanup was needed as legacy redirect/bridge code had already been removed.

## Production Configuration

**Final OAuth Endpoint Values (Production):**

- **base_url**: `https://dmitrybond.tech` (resolved from proxy headers or `PUBLIC_SITE_URL`)
- **auth_endpoint**: `/api/decap/authorize` (locked in config.yml.ts)
- **Effective URLs**:
  - Authorize: `https://dmitrybond.tech/api/decap/authorize` → redirects to `/api/decap/oauth/authorize`
  - Callback: `https://dmitrybond.tech/api/decap/oauth/callback` (canonical handler)

**One-Liner Confirmation:**

`/api/decap/authorize` now performs a 302 redirect to `/api/decap/oauth/authorize`, eliminating the 404 and allowing Decap CMS to authenticate via popup flow with both flat and scoped route shapes.


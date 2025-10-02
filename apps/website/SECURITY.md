# Security Notes

## OAuth GitHub Device Flow Security

This application implements a secure GitHub OAuth Device Flow for Decap CMS authentication. Here's how secrets are handled:

### Environment Variables (Server-Only)
- `OAUTH_GITHUB_CLIENT_ID`: GitHub OAuth application client ID
- `OAUTH_GITHUB_CLIENT_SECRET`: GitHub OAuth application client secret (NEVER exposed to client)
- `GITHUB_OAUTH_SCOPE`: Optional, defaults to "repo,user:email"

### Security Measures

1. **Server-Side Only**: All OAuth secrets are only accessible on the server side via environment variables
2. **No Client Exposure**: Secrets are never included in client bundles, HTML, or cookies
3. **SessionStorage Only**: Access tokens are temporarily stored in sessionStorage (not localStorage or cookies)
4. **No-Cache Headers**: All OAuth endpoints return `Cache-Control: no-store`
5. **Secure Cookies**: Optional helper cookies use `SameSite=Lax; Secure; Path=/oauth; Max-Age=900`
6. **No Logging**: Access tokens and secrets are never logged

### OAuth Flow Security

1. **Device Code Flow**: Uses GitHub's secure device code flow (no client secret in browser)
2. **Server Exchange**: Device codes are exchanged for access tokens on the server only
3. **Temporary Storage**: Tokens are stored in sessionStorage and removed after use
4. **Same-Tab Flow**: No popup windows to prevent focus/security issues

### File Security

- `/oauth/**` routes are server-only (`export const prerender = false`)
- No secrets in any client-side code
- Environment variables are not prefixed with `PUBLIC_`
- All OAuth responses include proper security headers

### Best Practices

- Never commit `.env` files with real secrets
- Use environment variables for all sensitive configuration
- Regularly rotate OAuth application secrets
- Monitor OAuth application usage in GitHub settings

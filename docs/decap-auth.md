# Decap CMS GitHub OAuth Authentication

This document describes the self-hosted GitHub OAuth authentication setup for Decap CMS on the personal website.

## Overview

The Decap CMS admin interface at `/website-admin` uses self-hosted GitHub OAuth endpoints instead of Netlify's git-gateway. This provides full control over the authentication flow and eliminates dependencies on external services.

## Architecture

### OAuth Flow

1. **Authorization**: User clicks "Login with GitHub" → redirects to `/api/decap/oauth/authorize`
2. **GitHub OAuth**: Server redirects to GitHub OAuth with proper scopes and state
3. **Callback**: GitHub redirects back to `/api/decap/oauth/callback` with authorization code
4. **Token Exchange**: Server exchanges code for access token and returns it to Decap CMS
5. **Authentication**: Decap CMS receives token and authenticates with GitHub API

### Security Features

- **CSRF Protection**: Signed state parameter with HMAC-SHA256
- **Secure Cookies**: HttpOnly, Secure (in production), SameSite=Lax
- **Short-lived State**: 5-minute expiry for OAuth state cookies
- **Timing-safe Comparison**: Prevents timing attacks on state validation

## Environment Variables

### Required Variables

```bash
# GitHub OAuth App credentials
DECAP_GITHUB_CLIENT_ID=your_github_oauth_app_client_id
DECAP_GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret

# Site configuration
PUBLIC_SITE_URL=https://pre-prod.dmitrybond.tech
DECAP_GITHUB_REPO=dmitrybond-tech/personal-website-pre-prod
DECAP_GITHUB_BRANCH=main
```

### Optional Variables

```bash
# OAuth state signing secret (for CSRF protection)
DECAP_OAUTH_STATE_SECRET=change_me_long_random
```

## GitHub OAuth App Configuration

### Required Settings

1. **Application Name**: `Personal Website CMS`
2. **Homepage URL**: `https://pre-prod.dmitrybond.tech`
3. **Authorization Callback URL**: `https://pre-prod.dmitrybond.tech/api/decap/oauth/callback`

### Required Scopes

- `repo` - Full access to repositories (required for Decap CMS to read/write content)

### Development Setup

For local development, add additional callback URLs:
- `http://localhost:4321/api/decap/oauth/callback`
- `https://your-tunnel-url.ngrok.io/api/decap/oauth/callback`

## Configuration Files

### Decap CMS Config

The main configuration is in `apps/website/public/website-admin/config.yml`:

```yaml
backend:
  name: github
  repo: dmitrybond-tech/personal-website-pre-prod
  branch: main
  base_url: ${PUBLIC_SITE_URL}
  auth_endpoint: /api/decap/oauth
```

### Development vs Production

- **Development**: Uses `local_backend: true` with decap-server proxy on port 8081
- **Production**: Uses `local_backend: false` with self-hosted OAuth endpoints

## API Endpoints

### `/api/decap/oauth/authorize`

**Method**: GET  
**Purpose**: Initiates GitHub OAuth flow

**Response**: 302 redirect to GitHub OAuth with:
- `client_id`: GitHub OAuth App client ID
- `redirect_uri`: Callback URL
- `state`: Signed state parameter for CSRF protection
- `scope`: `repo` (required for repository access)

### `/api/decap/oauth/callback`

**Method**: GET  
**Purpose**: Handles GitHub OAuth callback

**Parameters**:
- `code`: Authorization code from GitHub
- `state`: State parameter for validation

**Response**: HTML page that posts token back to Decap CMS opener window

## Security Considerations

### State Parameter Security

The OAuth state parameter is protected against CSRF attacks:

1. **Generation**: Random 32-character string using `nanoid`
2. **Signing**: HMAC-SHA256 signature with server secret
3. **Storage**: Signed state stored in httpOnly cookie
4. **Validation**: Timing-safe comparison of signatures
5. **Expiry**: 5-minute maximum lifetime

### Cookie Security

OAuth state cookies are configured with security best practices:

```javascript
{
  httpOnly: true,           // Prevent XSS access
  secure: production,       // HTTPS only in production
  sameSite: 'lax',         // CSRF protection
  maxAge: 5 * 60,          // 5 minutes expiry
  path: '/'                // Site-wide scope
}
```

## Troubleshooting

### Common Issues

1. **"OAuth configuration missing"**
   - Ensure `DECAP_GITHUB_CLIENT_ID` and `DECAP_GITHUB_CLIENT_SECRET` are set
   - Check environment variable loading

2. **"State signature mismatch"**
   - Verify `DECAP_OAUTH_STATE_SECRET` is consistent across requests
   - Check for clock skew between client and server

3. **"Token exchange failed"**
   - Verify GitHub OAuth App configuration
   - Check callback URL matches exactly
   - Ensure OAuth App has correct scopes

4. **"No access token"**
   - Check GitHub OAuth App is not rate-limited
   - Verify client credentials are correct

### Debug Endpoints

- `/api/oauth/health` - Check OAuth configuration status
- `/api/oauth/whoami` - Verify token and user information

### Logs

OAuth errors are logged to the server console with the prefix `[decap-oauth]`.

## Migration from Netlify

This setup replaces any Netlify git-gateway configuration:

### Removed
- `site_id` configuration
- `git-gateway` backend
- Netlify Identity scripts
- External OAuth dependencies

### Added
- Self-hosted OAuth endpoints
- CSRF protection
- Secure state management
- Full control over authentication flow

## Dependencies

### Required Packages

```json
{
  "cookie": "0.6.0",
  "nanoid": "5.0.7"
}
```

### Built-in Dependencies

- `node:crypto` - HMAC-SHA256 signing
- `fetch` - HTTP requests to GitHub API

## Maintenance

### Secret Rotation

To rotate the OAuth state secret:

1. Update `DECAP_OAUTH_STATE_SECRET` environment variable
2. Restart the application
3. Existing OAuth sessions will be invalidated (expected behavior)

### GitHub OAuth App Updates

When updating GitHub OAuth App settings:

1. Update callback URLs if domain changes
2. Verify required scopes are maintained
3. Test authentication flow after changes

### Monitoring

Monitor for:
- OAuth error rates
- Failed authentication attempts
- Token exchange failures
- State validation errors

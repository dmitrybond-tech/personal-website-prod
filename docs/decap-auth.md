# Decap CMS OAuth Authentication Setup

## Overview

This project uses **separate GitHub OAuth Apps** for different authentication purposes:

1. **Auth.js OAuth App**: For site user authentication
2. **Decap CMS OAuth App**: For content management authentication

## Required Environment Variables

### Auth.js Configuration
```bash
# Auth.js OAuth App credentials
AUTHJS_GITHUB_CLIENT_ID=your_authjs_client_id
AUTHJS_GITHUB_CLIENT_SECRET=your_authjs_client_secret

# Auth.js settings
AUTH_URL=http://localhost:4321
AUTH_TRUST_HOST=true
AUTH_SECRET=your-random-32-plus-character-secret-here
```

### Decap CMS Configuration
```bash
# Decap CMS OAuth App credentials
DECAP_GITHUB_CLIENT_ID=your_decap_client_id
DECAP_GITHUB_CLIENT_SECRET=your_decap_client_secret

# Decap CMS settings
DECAP_GITHUB_REPO=dmitrybond-tech/personal-website-pre-prod
DECAP_GITHUB_BRANCH=main
PUBLIC_SITE_URL=https://pre-prod.dmitrybond.tech

# Optional: OAuth state signing secret (for CSRF protection)
DECAP_OAUTH_STATE_SECRET=change_me_long_random
```

## GitHub OAuth App Setup

### 1. Auth.js OAuth App (Site Login)
- **Name**: "Auth.js Site Login"
- **Homepage URL**: `https://pre-prod.dmitrybond.tech`
- **Authorization callback URL**: `https://pre-prod.dmitrybond.tech/api/auth/callback/github`
- **Scopes**: `user:email` (minimal for site login)

### 2. Decap CMS OAuth App (Content Management)
- **Name**: "Decap CMS Admin"
- **Homepage URL**: `https://pre-prod.dmitrybond.tech`
- **Authorization callback URL**: `https://pre-prod.dmitrybond.tech/api/decap/oauth/callback`
- **Scopes**: `repo` (full repository access for content management)

## OAuth Flow

### Auth.js Flow
1. User clicks "Login" on site
2. Redirects to `/api/auth/callback/github`
3. Auth.js handles the OAuth flow
4. User is authenticated for site features

### Decap CMS Flow
1. User opens `/website-admin`
2. Clicks "Login with GitHub"
3. Redirects to `/api/decap/oauth/authorize`
4. Our custom endpoint redirects to GitHub OAuth
5. GitHub redirects to `/api/decap/oauth/callback`
6. Our custom endpoint exchanges code for token
7. Token is sent to Decap CMS for content management

## Security Features

- **CSRF Protection**: Signed state cookies with short expiration (5 minutes)
- **Separate OAuth Apps**: No credential sharing between Auth.js and Decap CMS
- **Secure Cookies**: `HttpOnly`, `Secure`, `SameSite=Lax`
- **State Validation**: Server-side state verification

## Troubleshooting

### Common Issues

1. **404 on OAuth endpoints**: Check that custom endpoints are deployed
2. **Invalid callback URL**: Verify GitHub OAuth App callback URLs match exactly
3. **State mismatch**: Check `DECAP_OAUTH_STATE_SECRET` is set and consistent
4. **Collection conflicts**: Ensure only API-generated config is loaded

### Verification Checklist

- [ ] Two separate GitHub OAuth Apps created
- [ ] Callback URLs match exactly (including https/http)
- [ ] Environment variables set correctly
- [ ] OAuth endpoints return 302 redirects (not 404)
- [ ] Decap CMS loads without collection conflicts
- [ ] Both Auth.js and Decap CMS can authenticate independently

## Development vs Production

### Development
- Uses `local_backend: true` for Decap CMS
- OAuth endpoints still work for testing
- Auth.js uses localhost URLs

### Production
- Uses GitHub backend for Decap CMS
- Full OAuth flow with production URLs
- Both authentication systems work independently

## Rotating Secrets

1. **Update GitHub OAuth App secrets** in GitHub settings
2. **Update environment variables** with new secrets
3. **Restart application** to pick up new credentials
4. **Test both authentication flows** to ensure they work

## API Endpoints

- `GET /api/decap/oauth/authorize` - Initiates Decap CMS OAuth flow
- `GET /api/decap/oauth/callback` - Handles GitHub OAuth callback
- `GET /api/website-admin/config.yml` - Dynamic Decap CMS configuration
- `GET /api/auth/callback/github` - Auth.js OAuth callback (handled by Auth.js)
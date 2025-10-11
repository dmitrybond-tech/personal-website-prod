# Decap CMS Admin Setup

This directory contains the Decap CMS (formerly Netlify CMS) admin interface for managing blog content.

## Configuration

### Repository & Branch

Edit `config.yml` to change the target repository or branch:

```yaml
backend:
  name: github
  repo: dmitrybond-tech/personal-website-prod  # Change to your repo
  branch: main                                  # Change to your branch
  base_url: https://dmitrybond.tech            # Change to your domain
  auth_endpoint: /api/decap
```

### Environment Variables

The OAuth proxy requires these environment variables:

**Primary (Decap-specific):**
- `DECAP_GITHUB_CLIENT_ID` - GitHub OAuth App Client ID
- `DECAP_GITHUB_CLIENT_SECRET` - GitHub OAuth App Client Secret

**Fallback (if DECAP_* not set):**
- `AUTHJS_GITHUB_CLIENT_ID` - Falls back to AuthJS credentials
- `AUTHJS_GITHUB_CLIENT_SECRET` - Falls back to AuthJS credentials

**Note:** The system will use `DECAP_*` vars if present, otherwise falls back to `AUTHJS_*` with a console warning.

## Testing OAuth

### 1. GitHub OAuth App Setup

Create a GitHub OAuth App at: https://github.com/settings/developers

**Settings:**
- **Application name:** Your Site - CMS
- **Homepage URL:** `https://yourdomain.com`
- **Authorization callback URL:** `https://yourdomain.com/api/decap/callback`

### 2. Local Testing

```bash
# Set environment variables
export DECAP_GITHUB_CLIENT_ID="your_dev_client_id"
export DECAP_GITHUB_CLIENT_SECRET="your_dev_client_secret"

# Start dev server
npm run dev

# Visit http://localhost:4321/website-admin/
```

### 3. Production Testing

```bash
# Test OAuth entry point (should redirect to GitHub)
curl -i "https://yourdomain.com/api/decap?provider=github&scope=repo&site_id=yourdomain.com"

# Expected: 302 redirect to github.com/login/oauth/authorize
```

### 4. Manual Testing Flow

1. Visit `/website-admin/`
2. Click "Login with GitHub"
3. Authorize the app on GitHub
4. Callback should close popup and refresh CMS
5. CMS UI should load, showing "Blog Posts" collection
6. Create/edit a post and publish
7. Verify commit appears in GitHub repo

## Files

- `index.html` - Minimal admin shell (loads Decap from CDN)
- `config.yml` - Decap CMS configuration (collections, backend, etc.)
- `override-login.client.js` - OAuth popup message handler
- `robots.txt` - Prevents search engine indexing
- `README.md` - This file

## Troubleshooting

**"GitHub OAuth client ID not configured"**
→ Set `DECAP_GITHUB_CLIENT_ID` and `DECAP_GITHUB_CLIENT_SECRET` environment variables

**"Config must have required property 'backend'"**
→ Check that `config.yml` is valid YAML and includes all required fields

**OAuth popup doesn't close**
→ Check browser console for CORS errors; ensure callback URL matches GitHub OAuth app settings

**Posts not loading**
→ Verify `folder: apps/website/src/content/blog` path exists and contains `.md` files

## Health Check

After deployment, verify:
- [ ] `/website-admin/` loads without 404
- [ ] No console errors about missing config
- [ ] Login button appears
- [ ] OAuth flow completes
- [ ] Collections are visible
- [ ] Can create/edit posts


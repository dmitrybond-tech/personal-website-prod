# OAuth Setup Runbook - Eliminate HTTP 500 on /oauth/callback

## Overview
This runbook eliminates HTTP 500 errors on the Decap CMS GitHub OAuth callback by:
- Hardening OAuth plugin with allowed hosts
- Adding server diagnostics endpoints
- Forcing manual CMS initialization (no Netlify)
- Ensuring same tunnel host for entire OAuth flow

## Prerequisites
1. **GitHub OAuth App** configured with correct callback URL
2. **Tunnel service** (e.g., localtunnel, ngrok) providing consistent subdomain
3. **Environment variables** properly set in `.env.local`

## Step 1: Environment Setup

### Create `.env.local` file (DO NOT COMMIT)
```powershell
# Navigate to the app directory
cd C:\PersonalProjects\website-v3\website\apps\website

# Create .env.local with your actual OAuth credentials
@"
OAUTH_GITHUB_CLIENT_ID=your_actual_client_id_here
OAUTH_GITHUB_CLIENT_SECRET=your_actual_client_secret_here
TUNNEL_HOSTS=your-tunnel-subdomain.lhr.life
"@ | Out-File -FilePath .env.local -Encoding UTF8
```

### Update GitHub OAuth App Settings
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Update **Authorization callback URL** to: `https://your-tunnel-subdomain.lhr.life/oauth/callback`
3. **CRITICAL**: Update this URL every time your tunnel subdomain changes

## Step 2: Start Development Server

```powershell
# Clear Vite cache (if needed)
if (Test-Path .\node_modules\.vite) { Remove-Item -Recurse -Force .\node_modules\.vite }

# Start the development server
npm run dev -- --port 4321
```

## Step 3: Verify Setup

### Test Environment Variables
```powershell
# Test local environment
Start-Process "http://localhost:4321/oauth/check"

# Test tunnel environment (replace with your actual tunnel URL)
Start-Process "https://your-tunnel-subdomain.lhr.life/oauth/check"
```

**Expected Response:**
```json
{
  "host": "your-tunnel-subdomain.lhr.life",
  "hasClientId": true,
  "hasClientSecret": true,
  "allowedHostsFromEnv": ["your-tunnel-subdomain.lhr.life"],
  "note": "Values are not returned; only presence flags."
}
```

### Test OAuth Echo Endpoint
```powershell
# Test with dummy parameters
Start-Process "https://your-tunnel-subdomain.lhr.life/oauth/echo?code=test&state=test"
```

## Step 4: OAuth Flow Testing

### Critical Rules for Success
1. **Use ONE tunnel host for the ENTIRE flow**
2. **Clear cookies if tunnel host changes**
3. **Ensure GitHub OAuth App callback URL matches current tunnel**

### Step-by-Step OAuth Test
```powershell
# 1. Clear browser cookies for *.lhr.life domain
# 2. Navigate to admin interface
Start-Process "https://your-tunnel-subdomain.lhr.life/website-admin"

# 3. Click "Login with GitHub" - should redirect to GitHub
# 4. Authorize the app on GitHub
# 5. Should redirect back to: https://your-tunnel-subdomain.lhr.life/oauth/callback
# 6. Should then redirect to: https://your-tunnel-subdomain.lhr.life/website-admin
```

## Step 5: Troubleshooting

### Check Server Logs
The middleware will log all OAuth requests. Look for:
```
[OAUTH:in] { path: "/oauth/callback", host: "your-tunnel-subdomain.lhr.life", query: {...}, cookies: [...] }
[OAUTH:out] { path: "/oauth/callback", status: 200 }
```

### Common Issues and Solutions

#### Issue: HTTP 500 on /oauth/callback
**Causes:**
- Tunnel host changed mid-flow (cookies/state mismatch)
- GitHub OAuth App callback URL doesn't match current tunnel
- Missing or incorrect environment variables

**Solutions:**
1. Clear all cookies for *.lhr.life
2. Update GitHub OAuth App callback URL
3. Restart dev server after changing .env.local
4. Use same tunnel host for entire flow

#### Issue: hasClientId=false or hasClientSecret=false
**Solution:**
- Check .env.local file exists and has correct variable names
- Restart dev server after editing .env.local
- Ensure no spaces around = in .env.local

#### Issue: "api.netlify.com/auth" in network requests
**Solution:**
- The manual CMS init should prevent this
- Check that `window.CMS_MANUAL_INIT = true` is set
- Verify CMS.init is called after DOMContentLoaded

### Debug Commands
```powershell
# Check if environment variables are loaded
Get-Content .env.local

# Test OAuth endpoints
curl "http://localhost:4321/oauth/check"
curl "https://your-tunnel-subdomain.lhr.life/oauth/check"

# Check server logs for OAuth requests
# (Look in the terminal where npm run dev is running)
```

## Step 6: Production Deployment

### Environment Variables for Production
Ensure these are set in your production environment:
- `OAUTH_GITHUB_CLIENT_ID`
- `OAUTH_GITHUB_CLIENT_SECRET`
- `TUNNEL_HOSTS` (comma-separated list of allowed tunnel hosts)

### GitHub OAuth App for Production
- Update callback URL to your production domain
- Or use multiple callback URLs if needed

## Files Modified/Created

### New Files:
- `src/middleware.ts` - OAuth request logging
- `src/pages/oauth/check.ts` - Environment diagnostics
- `src/pages/oauth/echo.ts` - Callback debugging
- `public/website-admin/config.dev.yml` - Local development config
- `env.local.example` - Environment variable template

### Modified Files:
- `astro.config.mjs` - Added allowed hosts configuration
- `src/pages/website-admin/index.html` - Manual CMS initialization

## Success Criteria
✅ `/oauth/check` returns hasClientId=true, hasClientSecret=true  
✅ `/oauth/echo` shows cookies and query parameters  
✅ Server logs show [OAUTH:in] and [OAUTH:out] for OAuth requests  
✅ GitHub OAuth flow completes without HTTP 500  
✅ CMS loads successfully after OAuth authentication  

## Emergency Rollback
If issues persist, you can temporarily disable OAuth:
1. Set `oauthDisabled: true` in `astro.config.mjs`
2. Use local backend for development
3. Investigate issues without affecting the main site

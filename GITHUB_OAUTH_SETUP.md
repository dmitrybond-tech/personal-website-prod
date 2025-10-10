# GitHub OAuth App Setup for Production

## 🔧 GitHub OAuth App Configuration

### 1. **Create/Update GitHub OAuth App**

Go to: https://github.com/settings/developers

**Settings:**
```
Application name: Dmitry Bond - CMS
Homepage URL: https://dmitrybond.tech
Authorization callback URL: https://dmitrybond.tech/api/decap/callback
```

### 2. **Repository Access**

**For Production:**
- ✅ Grant access to `dmitrybond-tech/personal-website-prod`
- ✅ Repository must be accessible with OAuth App

### 3. **Environment Variables**

**Production (.env.prod):**
```bash
# Decap CMS OAuth
DECAP_GITHUB_CLIENT_ID=your_oauth_app_client_id
DECAP_GITHUB_CLIENT_SECRET=your_oauth_app_client_secret

# Site configuration
PUBLIC_SITE_URL=https://dmitrybond.tech
NODE_ENV=production
```

### 4. **Security Notes**

- **Separate OAuth Apps:** Use different OAuth Apps for dev/prod
- **Callback URLs:** Must match exactly (including trailing slashes)
- **Repository Permissions:** Only grant access to required repos
- **Client Secret:** Keep secure, never commit to git

## 🧪 Testing OAuth Flow

### 1. **Local Testing**
```bash
# Set up local OAuth App with callback:
http://localhost:4321/api/decap/callback

# Environment variables:
DECAP_GITHUB_CLIENT_ID=dev_client_id
DECAP_GITHUB_CLIENT_SECRET=dev_client_secret
PUBLIC_SITE_URL=http://localhost:4321
```

### 2. **Production Testing**
```bash
# Production OAuth App with callback:
https://dmitrybond.tech/api/decap/callback

# Environment variables:
DECAP_GITHUB_CLIENT_ID=prod_client_id
DECAP_GITHUB_CLIENT_SECRET=prod_client_secret
PUBLIC_SITE_URL=https://dmitrybond.tech
```

## ✅ Verification Checklist

- [ ] OAuth App created in GitHub
- [ ] Callback URL matches exactly
- [ ] Repository access granted
- [ ] Environment variables set
- [ ] Client ID/Secret configured
- [ ] Admin loads at `/website-admin/`
- [ ] Login button appears
- [ ] OAuth popup opens
- [ ] GitHub authorization works
- [ ] Callback redirects correctly
- [ ] CMS UI loads after auth
- [ ] Can create/edit posts

---

**Status:** ✅ Ready for Production  
**Next Step:** Deploy with proper environment variables

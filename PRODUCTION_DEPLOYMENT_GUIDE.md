# Decap CMS — Production Deployment Guide

## 🚀 Production Checklist

### ✅ Pre-Deployment

1. **Environment Variables**
   ```bash
   # GitHub OAuth App for Decap CMS
   DECAP_GITHUB_CLIENT_ID=your_client_id
   DECAP_GITHUB_CLIENT_SECRET=your_client_secret
   
   # Site configuration
   PUBLIC_SITE_URL=https://dmitrybond.tech
   NODE_ENV=production
   ```

2. **GitHub OAuth App Settings**
   - **Application name:** `Dmitry Bond - CMS`
   - **Homepage URL:** `https://dmitrybond.tech`
   - **Authorization callback URL:** `https://dmitrybond.tech/api/decap/callback`
   - **Repository access:** `dmitrybond-tech/personal-website-prod`

3. **Repository Permissions**
   - OAuth App must have access to `dmitrybond-tech/personal-website-prod`
   - Repository must be accessible with provided credentials

### 🔧 Production Configuration

#### 1. **Astro Configuration** (`astro.config.ts`)
```typescript
export default defineConfig({
  site: 'https://dmitrybond.tech',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  
  integrations: [
    react(),
    auth(),
    decapCmsOAuth({
      adminRoute: '/website-admin',
      oauthLoginRoute: '/api/decap',
      oauthCallbackRoute: '/api/decap/callback',
      oauthDisabled: false, // Enable for production
      adminDisabled: false,
    }),
  ],
});
```

#### 2. **Decap CMS Config** (`public/config.yml`)
```yaml
backend:
  name: github
  repo: dmitrybond-tech/personal-website-prod
  branch: main
  base_url: https://dmitrybond.tech
  auth_endpoint: /api/decap
  site_domain: dmitrybond.tech

publish_mode: simple
media_folder: apps/website/public/uploads
public_folder: /uploads

collections:
  - name: posts
    label: Blog Posts
    folder: apps/website/src/content/posts/en
    create: true
    slug: '{{year}}-{{month}}-{{day}}-{{slug}}'
    format: frontmatter
    extension: md
    fields:
      - { label: 'Title', name: 'title', widget: 'string' }
      - { label: 'Date', name: 'date', widget: 'datetime' }
      - { label: 'Description', name: 'description', widget: 'text', required: false }
      - { label: 'Body', name: 'body', widget: 'markdown' }
```

### 🔒 Security Configuration

#### 1. **Admin Access** (`public/website-admin/index.html`)
- ✅ `robots: noindex,nofollow`
- ✅ Security headers (X-Frame-Options, X-XSS-Protection)
- ✅ Referrer policy
- ✅ Integrity checks for external scripts

#### 2. **File Structure**
```
apps/website/public/
├── config.yml                    # Main Decap config
├── website-admin/
│   ├── index.html               # Admin interface
│   └── robots.txt              # Block crawlers
└── uploads/                     # Media uploads
```

### 🌐 Deployment Steps

#### 1. **Build for Production**
```bash
# Build the application
npm run build

# Test locally with production build
npm run preview
```

#### 2. **Server Configuration**
```nginx
# Nginx configuration for CMS admin
location /website-admin/ {
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Cache control
    add_header Cache-Control "no-store, no-cache, must-revalidate";
    
    # Serve admin files
    try_files $uri $uri/ /website-admin/index.html;
}

# Block access to config files
location ~ \.yml$ {
    return 404;
}
```

#### 3. **Environment Setup**
```bash
# Production environment variables
export NODE_ENV=production
export PUBLIC_SITE_URL=https://dmitrybond.tech
export DECAP_GITHUB_CLIENT_ID=your_client_id
export DECAP_GITHUB_CLIENT_SECRET=your_client_secret
```

### 🧪 Testing Checklist

#### 1. **Pre-Deploy Tests**
- [ ] Build completes without errors
- [ ] OAuth endpoints respond correctly
- [ ] GitHub OAuth App configured
- [ ] Repository access verified

#### 2. **Post-Deploy Tests**
- [ ] Admin loads: `https://dmitrybond.tech/website-admin/`
- [ ] Login button appears
- [ ] OAuth flow works
- [ ] CMS UI loads after login
- [ ] Can create/edit posts
- [ ] Media uploads work
- [ ] Changes commit to GitHub

#### 3. **Security Tests**
- [ ] Admin area blocked by robots.txt
- [ ] No direct access to config.yml
- [ ] OAuth tokens stored securely
- [ ] HTTPS enforced

### 📊 Monitoring

#### 1. **Health Checks**
```bash
# Check OAuth endpoints
curl -I https://dmitrybond.tech/api/decap
curl -I https://dmitrybond.tech/api/decap/callback

# Check admin access
curl -I https://dmitrybond.tech/website-admin/
```

#### 2. **Log Monitoring**
- Monitor OAuth authentication attempts
- Track CMS usage patterns
- Alert on failed logins
- Monitor GitHub API rate limits

### 🚨 Troubleshooting

#### Common Issues:

1. **OAuth 404 Errors**
   - Verify `astro-decap-cms-oauth` integration is enabled
   - Check GitHub OAuth App callback URL
   - Ensure dev server restart after config changes

2. **Repository Access Denied**
   - Verify OAuth App has repository permissions
   - Check repository is public or OAuth App has access
   - Verify branch name matches (`main`)

3. **Config Not Loading**
   - Ensure `config.yml` is in `public/` directory
   - Check file permissions
   - Verify YAML syntax

4. **Media Upload Issues**
   - Check `uploads/` directory permissions
   - Verify GitHub API token permissions
   - Check file size limits

### 📋 Maintenance

#### Regular Tasks:
- [ ] Monitor GitHub API usage
- [ ] Update Decap CMS version periodically
- [ ] Review OAuth App permissions
- [ ] Backup content regularly
- [ ] Monitor security headers

#### Updates:
```bash
# Update Decap CMS
npm update decap-cms

# Update Astro integration
npm update astro-decap-cms-oauth
```

### 🔄 Rollback Playbook

#### Emergency Rollback to Known Good State

When production issues occur, use this rollback procedure to restore to a known working commit:

#### 1. **Quick Rollback (PowerShell)**
```powershell
# Set variables
$CommitHash = "34f31734ddfd6780ac0c70b9ae95c019935a3aa5"  # Known good commit
$BackupName = "backup/main-$(Get-Date -Format 'yyyy-MM-dd')"
$TagName = "stable-$(Get-Date -Format 'yyyy-MM-dd')"

# Create backup and rollback
git fetch origin --prune
git switch main
git pull --ff-only
git branch $BackupName
git push origin $BackupName
git tag -a $TagName $CommitHash -m "Last known good ($(Get-Date -Format 'yyyy-MM-dd'))"
git push origin $TagName
git reset --hard $CommitHash
git push --force-with-lease origin main
```

#### 2. **Automated Rollback Script**
Use the provided PowerShell script:
```powershell
# Run the rollback script
.\scripts\rollback-to-known-good.ps1 -CommitHash "34f31734ddfd6780ac0c70b9ae95c019935a3aa5"
```

#### 3. **Post-Rollback Steps**
1. **Wait for CI rebuild** (GitHub Actions will rebuild the Docker image)
2. **Deploy on VPS:**
   ```bash
   cd /opt/prod
   sh deploy.sh
   ```
3. **Validate deployment:**
   ```bash
   # Test main pages
   curl -sI https://dmitrybond.tech/en/about
   curl -sI https://dmitrybond.tech/_astro/*.css
   
   # Check for 200 responses, no ERR_CONNECTION_RESET
   ```

#### 4. **Digest Pinning (Optional)**
For maximum reproducibility, pin the exact Docker image digest:
```bash
# Get the new digest after CI rebuild
docker pull ghcr.io/dmitrybond-tech/personal-website-prod:main
docker inspect --format='{{index .RepoDigests 0}}' ghcr.io/dmitrybond-tech/personal-website-prod:main

# Update compose.yml with exact digest
# image: ghcr.io/dmitrybond-tech/personal-website-prod@sha256:XXXXXXXX...
```

#### 5. **Recovery Verification**
- [ ] Main branch points to known good commit
- [ ] Backup branch exists with pre-rollback state
- [ ] Stable tag created at known good commit
- [ ] CI rebuilt and published new image
- [ ] Production serves pages with HTTP 200
- [ ] No ERR_CONNECTION_RESET errors
- [ ] Static assets load correctly

#### 6. **Rollback Safety**
- ✅ Backup branch preserves previous state
- ✅ Annotated tag marks stable point
- ✅ Force-with-lease prevents accidental overwrites
- ✅ CI automatically rebuilds from rolled-back commit
- ✅ Production deployment uses deterministic image

---

**Status:** ✅ Production-Ready  
**Last Updated:** October 24, 2025  
**Version:** 1.0.0

# Production Environment Setup

## 🔧 Environment Variables для Production

### 1. **Server Environment** (.env.production)

```bash
# GitHub OAuth App (Production)
DECAP_GITHUB_CLIENT_ID=prod_github_client_id
DECAP_GITHUB_CLIENT_SECRET=prod_github_client_secret

# Site Configuration
PUBLIC_SITE_URL=https://dmitrybond.tech
NODE_ENV=production

# Optional: Additional security
SESSION_SECRET=your_secure_session_secret
```

### 2. **GitHub OAuth App (Production)**

**Settings:**
```
Application name: Dmitry Bond - CMS (Production)
Homepage URL: https://dmitrybond.tech
Authorization callback URL: https://dmitrybond.tech/api/decap/callback
```

**Repository Access:**
- ✅ Grant access to `dmitrybond-tech/personal-website-prod`
- ✅ Ensure repository is accessible

### 3. **Build & Deploy Commands**

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to production server
# (depends on your hosting provider)
```

## 🚀 Production Deployment

### 1. **Build Process**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Build application
npm run build

# Test production build
npm run preview
```

### 2. **Server Configuration**

**Nginx Configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name dmitrybond.tech;
    
    # SSL certificates
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Main application
    location / {
        proxy_pass http://localhost:4321;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # CMS Admin - additional security
    location /website-admin/ {
        # Same proxy settings
        proxy_pass http://localhost:4321;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Additional security headers
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://localhost:4321;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. **PM2 Process Manager**

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'dmitrybond-website',
    script: 'npm',
    args: 'run preview',
    cwd: '/path/to/apps/website',
    env: {
      NODE_ENV: 'production',
      PORT: 4321,
      PUBLIC_SITE_URL: 'https://dmitrybond.tech',
      DECAP_GITHUB_CLIENT_ID: 'your_prod_client_id',
      DECAP_GITHUB_CLIENT_SECRET: 'your_prod_client_secret',
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

**Start with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🧪 Production Testing

### 1. **Health Checks**
```bash
# Check if server is running
curl -I https://dmitrybond.tech

# Check OAuth endpoints
curl -I https://dmitrybond.tech/api/decap?provider=github
curl -I https://dmitrybond.tech/api/decap/callback

# Check admin access
curl -I https://dmitrybond.tech/website-admin/
```

### 2. **OAuth Flow Testing**
1. Visit `https://dmitrybond.tech/website-admin/`
2. Click "Login with GitHub"
3. Verify GitHub OAuth redirect
4. Complete authorization
5. Verify CMS UI loads
6. Test creating/editing posts

### 3. **Security Testing**
```bash
# Check security headers
curl -I https://dmitrybond.tech/website-admin/ | grep -E "(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection)"

# Verify robots.txt
curl https://dmitrybond.tech/website-admin/robots.txt

# Test config.yml is not accessible
curl -I https://dmitrybond.tech/config.yml
```

## 📊 Monitoring

### 1. **Log Monitoring**
```bash
# PM2 logs
pm2 logs dmitrybond-website

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 2. **Performance Monitoring**
- Monitor GitHub API rate limits
- Track OAuth success/failure rates
- Monitor CMS usage patterns
- Alert on failed logins

### 3. **Backup Strategy**
```bash
# Regular backups
tar -czf backup-$(date +%Y%m%d).tar.gz /path/to/apps/website/dist/
```

## 🚨 Troubleshooting

### Common Issues:

1. **OAuth 404 Errors**
   - Verify environment variables are set
   - Check GitHub OAuth App callback URL
   - Ensure API routes are built correctly

2. **Repository Access Denied**
   - Verify OAuth App has repository permissions
   - Check repository is accessible
   - Verify branch name matches

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check TypeScript compilation
   - Verify all dependencies are installed

---

**Status:** ✅ Production Ready  
**Environment:** Production  
**Security:** Hardened  
**Monitoring:** Configured

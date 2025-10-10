# Production Deployment Checklist

## ✅ Pre-Deployment

### Environment Setup
- [ ] Production environment variables configured
- [ ] GitHub OAuth App created for production
- [ ] Repository access granted to OAuth App
- [ ] SSL certificates installed
- [ ] Domain DNS configured

### Code Preparation
- [ ] All tests passing
- [ ] Build completes without errors
- [ ] No console errors in development
- [ ] OAuth flow tested locally
- [ ] Security headers working

## 🚀 Deployment Steps

### 1. Build & Test
```bash
# Clean build
rm -rf node_modules dist .astro
npm install
npm run build

# Test production build
npm run preview
```

### 2. Server Setup
- [ ] Upload built files to production server
- [ ] Set environment variables
- [ ] Configure reverse proxy (Nginx)
- [ ] Start application with PM2

### 3. OAuth Configuration
- [ ] Update GitHub OAuth App callback URL
- [ ] Verify client ID/secret in production
- [ ] Test OAuth flow end-to-end

## 🧪 Post-Deployment Testing

### Functional Tests
- [ ] Homepage loads: `https://dmitrybond.tech`
- [ ] Admin loads: `https://dmitrybond.tech/website-admin/`
- [ ] OAuth login works
- [ ] CMS UI appears after login
- [ ] Can create new post
- [ ] Can edit existing post
- [ ] Can upload media
- [ ] Changes commit to GitHub

### Security Tests
- [ ] Security headers present
- [ ] Admin area blocked by robots.txt
- [ ] No direct access to config files
- [ ] HTTPS enforced
- [ ] CORS configured correctly

### Performance Tests
- [ ] Page load times acceptable
- [ ] OAuth flow completes quickly
- [ ] No memory leaks
- [ ] GitHub API rate limits not exceeded

## 📊 Monitoring Setup

### Logs
- [ ] Application logs configured
- [ ] Nginx logs monitored
- [ ] Error tracking enabled
- [ ] OAuth success/failure tracked

### Alerts
- [ ] Server down alerts
- [ ] OAuth failure alerts
- [ ] High error rate alerts
- [ ] GitHub API limit alerts

## 🔧 Maintenance

### Regular Tasks
- [ ] Monitor GitHub API usage
- [ ] Review OAuth App permissions
- [ ] Update dependencies
- [ ] Backup content
- [ ] Security audit

### Updates
- [ ] Decap CMS updates
- [ ] Astro framework updates
- [ ] Security patches
- [ ] Node.js updates

---

**Deployment Date:** __________  
**Deployed By:** __________  
**Status:** ✅ Ready for Production

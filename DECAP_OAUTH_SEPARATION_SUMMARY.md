# Decap CMS OAuth Separation Summary

## 🎯 **Goal Achieved**
Successfully separated Auth.js and Decap CMS OAuth configurations to eliminate conflicts and ensure independent operation.

## 🔧 **Changes Applied**

### 1. **astro.config.ts**
- **Removed**: Automatic variable overwriting (`process.env.GITHUB_CLIENT_ID = process.env.DECAP_GITHUB_CLIENT_ID`)
- **Disabled**: `decapCmsOAuth` integration (using custom endpoints instead)
- **Added**: Separate logging for Auth.js and Decap OAuth App client IDs
- **Result**: No more credential conflicts between Auth.js and Decap CMS

### 2. **env.example**
- **Clarified**: Separate OAuth App requirements with clear instructions
- **Added**: Detailed GitHub OAuth App setup instructions
- **Organized**: Variables by authentication system (Auth.js vs Decap CMS)
- **Result**: Clear separation of concerns and setup guidance

### 3. **Documentation**
- **Created**: `docs/decap-auth.md` with comprehensive setup guide
- **Included**: Troubleshooting, security features, and verification checklist
- **Result**: Complete documentation for OAuth setup and maintenance

## 🏗️ **Architecture Overview**

### **Auth.js OAuth App (Site Login)**
- **Purpose**: User authentication for site features
- **Callback**: `https://pre-prod.dmitrybond.tech/api/auth/callback/github`
- **Variables**: `AUTHJS_GITHUB_CLIENT_ID`, `AUTHJS_GITHUB_CLIENT_SECRET`
- **Scopes**: `user:email` (minimal)

### **Decap CMS OAuth App (Content Management)**
- **Purpose**: Content management authentication
- **Callback**: `https://pre-prod.dmitrybond.tech/api/decap/oauth/callback`
- **Variables**: `DECAP_GITHUB_CLIENT_ID`, `DECAP_GITHUB_CLIENT_SECRET`
- **Scopes**: `repo` (full repository access)

## 🔒 **Security Improvements**

1. **No Credential Sharing**: Each system uses its own OAuth App
2. **Independent Operation**: Auth.js and Decap CMS can work simultaneously
3. **Proper Scoping**: Minimal permissions for site login, full access for content management
4. **CSRF Protection**: Signed state cookies for Decap CMS OAuth flow

## 📋 **Required Actions**

### **GitHub OAuth App Setup**
1. **Create "Auth.js Site Login" OAuth App**:
   - Callback: `https://pre-prod.dmitrybond.tech/api/auth/callback/github`
   - Scopes: `user:email`

2. **Create "Decap CMS Admin" OAuth App**:
   - Callback: `https://pre-prod.dmitrybond.tech/api/decap/oauth/callback`
   - Scopes: `repo`

### **Environment Variables**
```bash
# Auth.js OAuth App
AUTHJS_GITHUB_CLIENT_ID=your_authjs_client_id
AUTHJS_GITHUB_CLIENT_SECRET=your_authjs_client_secret

# Decap CMS OAuth App
DECAP_GITHUB_CLIENT_ID=your_decap_client_id
DECAP_GITHUB_CLIENT_SECRET=your_decap_client_secret

# Common settings
PUBLIC_SITE_URL=https://pre-prod.dmitrybond.tech
DECAP_GITHUB_REPO=dmitrybond-tech/personal-website-pre-prod
DECAP_GITHUB_BRANCH=main
DECAP_OAUTH_STATE_SECRET=change_me_long_random
```

## ✅ **Verification Checklist**

- [ ] Two separate GitHub OAuth Apps created
- [ ] Callback URLs match exactly
- [ ] Environment variables set correctly
- [ ] Auth.js login works independently
- [ ] Decap CMS login works independently
- [ ] No credential conflicts in logs
- [ ] Both systems can authenticate simultaneously

## 🚀 **Benefits**

1. **No Conflicts**: Auth.js and Decap CMS operate independently
2. **Better Security**: Proper permission scoping for each system
3. **Easier Maintenance**: Clear separation of authentication concerns
4. **Scalability**: Can add more OAuth integrations without conflicts
5. **Debugging**: Easier to troubleshoot authentication issues

## 📚 **Documentation**

- **Setup Guide**: `docs/decap-auth.md`
- **Environment Variables**: `apps/website/env.example`
- **Configuration**: `apps/website/astro.config.ts`

## 🔄 **Migration Notes**

- **Existing OAuth Apps**: Can be reused, just update callback URLs
- **Environment Variables**: Add new `AUTHJS_*` variables alongside existing `DECAP_*`
- **No Breaking Changes**: Existing Decap CMS functionality preserved
- **Backward Compatible**: Old configurations will still work during transition

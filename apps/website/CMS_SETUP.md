# Decap CMS Integration Setup

This document explains how to set up and use the Decap CMS integration with GitHub OAuth authentication.

## Overview

The website includes a Decap CMS admin interface at `/website-admin/` that allows authorized users to manage content through a web interface. The integration uses:

- **Decap CMS** for the admin interface
- **GitHub OAuth** for authentication
- **Auth.js** for session management
- **GitHub API** for authorization (organization/team membership or allowlist)

## Prerequisites

1. A GitHub repository with the website code
2. GitHub OAuth App credentials
3. Environment variables configured

## GitHub OAuth App Setup

### 1. Create a GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: `Your Website CMS`
   - **Homepage URL**: `https://yourdomain.com` (or `http://localhost:4321` for dev)
   - **Authorization callback URL**: `https://yourdomain.com/oauth/callback` (or `http://localhost:4321/oauth/callback` for dev)
4. Click "Register application"
5. Copy the **Client ID** and generate a **Client Secret**

### 2. Configure Environment Variables

Copy `env.example` to `.env.local` and fill in the values:

```bash
# GitHub OAuth credentials
OAUTH_GITHUB_CLIENT_ID=your_client_id_here
OAUTH_GITHUB_CLIENT_SECRET=your_client_secret_here

# Auth.js configuration
AUTH_REDIRECT_URI=http://localhost:4321/oauth/callback  # For production: https://yourdomain.com/oauth/callback
AUTH_STATE_SECRET=your-random-32-plus-character-secret-here
AUTH_TRUST_HOST=true

# Admin authorization (choose one or both)
ADMIN_GH_ALLOWLIST=your-github-username,another-admin  # Comma-separated usernames
ADMIN_GH_ORG=your-org-name                            # Optional: GitHub organization
ADMIN_GH_TEAM_SLUG=admin-team                         # Optional: Team slug within the org
```

### 3. Generate AUTH_STATE_SECRET

Generate a secure random string for `AUTH_STATE_SECRET`:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## Authorization Methods

The admin panel supports two authorization methods:

### Method 1: Allowlist (Recommended for small teams)
Set `ADMIN_GH_ALLOWLIST` with comma-separated GitHub usernames:
```bash
ADMIN_GH_ALLOWLIST=alice,bob,charlie
```

### Method 2: GitHub Organization/Team (Recommended for larger teams)
Set both `ADMIN_GH_ORG` and `ADMIN_GH_TEAM_SLUG`:
```bash
ADMIN_GH_ORG=mycompany
ADMIN_GH_TEAM_SLUG=content-editors
```

Users must be members of the specified team to access the admin panel.

### Method 3: Both (Most Flexible)
You can use both methods - users in the allowlist OR team members can access the admin.

## Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Check Environment Variables
```bash
npm run check:env
```

### 3. Start Development Server
```bash
npm run dev:cms
```

This will:
- Start the Astro development server on `http://localhost:4321`
- Display the admin URL and OAuth callback URL
- Enable the CMS interface at `http://localhost:4321/website-admin`

### 4. Access the Admin Panel

1. Navigate to `http://localhost:4321/website-admin`
2. You'll be redirected to GitHub OAuth if not authenticated
3. After authentication, you'll see the Decap CMS interface
4. If you're not authorized, you'll see an "Access Denied" message

## Production Deployment

### 1. Update OAuth App Settings

For production, update your GitHub OAuth App:
- **Homepage URL**: `https://yourdomain.com`
- **Authorization callback URL**: `https://yourdomain.com/oauth/callback`

### 2. Update Environment Variables

```bash
AUTH_REDIRECT_URI=https://yourdomain.com/oauth/callback
```

### 3. Deploy

The CMS will be available at `https://yourdomain.com/website-admin`

## Content Management

### Collections

The CMS is configured with the following collections (see `public/website-admin/config.yml`):

- **Blog**: Markdown blog posts with i18n support
- **About Page**: JSON-based page content with blocks
- **BookMe Page**: Calendar integration content
- **Footer**: Site footer content with links and legal information

### Media Management

- **Upload folder**: `public/uploads/`
- **Public URL**: `/uploads/`
- Files are committed directly to the repository

### Internationalization

The CMS supports multiple languages (English and Russian) with:
- Separate folders for each locale
- i18n-aware field widgets
- Default locale configuration

## Security Considerations

1. **Repository Access**: Users need write access to the GitHub repository to commit changes
2. **OAuth Scopes**: The GitHub OAuth app requests minimal scopes (user:email, read:org)
3. **Session Management**: Auth.js handles secure session management
4. **Authorization**: Double-gated access (session + GitHub membership/allowlist)

## Troubleshooting

### Common Issues

1. **"Access Denied" Error**
   - Check if your GitHub username is in `ADMIN_GH_ALLOWLIST`
   - Verify organization/team membership if using that method
   - Ensure the GitHub OAuth app has the correct callback URL

2. **OAuth Redirect Issues**
   - Verify `AUTH_REDIRECT_URI` matches the GitHub OAuth app callback URL
   - Check that `AUTH_TRUST_HOST=true` is set
   - Ensure the domain is allowed in your OAuth app settings

3. **CMS Not Loading**
   - Check browser console for JavaScript errors
   - Verify all environment variables are set
   - Ensure the development server is running on the correct port

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=1
```

### Environment Check

Run the environment check script:
```bash
npm run check:env
```

## File Structure

```
apps/website/
├── public/website-admin/
│   ├── config.yml          # Development CMS config
│   └── config.prod.yml     # Production CMS config
├── src/
│   ├── middleware.ts       # Authorization middleware
│   └── pages/website-admin/
│       └── index.html      # CMS admin interface
├── auth.config.ts          # Auth.js configuration
├── astro.config.ts         # Astro configuration with CMS integration
└── env.example             # Environment variables template
```

## Support

For issues related to:
- **Decap CMS**: Check the [official documentation](https://decapcms.org/docs/)
- **Auth.js**: Check the [Auth.js documentation](https://authjs.dev/)
- **GitHub OAuth**: Check the [GitHub OAuth documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
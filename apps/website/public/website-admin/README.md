# Decap CMS Admin

Content management interface for the personal website.

## Configuration

- **Config path**: `/website-admin/config.yml` (static file)
- **OAuth endpoint**: `/api/decap` (GitHub OAuth entry)
- **Callback endpoint**: `/api/decap/callback` (OAuth completion)

## Required Environment Variables

```bash
DECAP_GITHUB_CLIENT_ID=<your_github_oauth_app_client_id>
DECAP_GITHUB_CLIENT_SECRET=<your_github_oauth_app_secret>
```

**Fallback**: If `DECAP_GITHUB_*` vars are not set, the system will use `AUTHJS_GITHUB_CLIENT_ID` and `AUTHJS_GITHUB_CLIENT_SECRET`.

## Smoke Tests

```bash
# 1. Verify config is accessible
curl -i https://<your-host>/website-admin/config.yml

# 2. Test OAuth entry (expect 302 redirect to github.com)
curl -i "https://<your-host>/api/decap?provider=github&scope=repo&site_id=<your-host>"

# 3. Check environment variables inside container
docker exec -it <container-name> env | grep -E "DECAP_|AUTHJS_"
```

## Troubleshooting

- **404 on config.yml**: Ensure static file exists at `apps/website/public/website-admin/config.yml`
- **500 on /api/decap**: Check that `DECAP_GITHUB_CLIENT_ID` or `AUTHJS_GITHUB_CLIENT_ID` is set
- **OAuth fails**: Verify GitHub OAuth app callback URL is set to `https://<your-host>/api/decap/callback`

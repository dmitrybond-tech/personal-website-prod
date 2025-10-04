# DKAP Wire-Up Script

This script scans existing Markdown/MDX content and generates a Decap CMS configuration to wire up the local backend for content editing.

## Usage

### Dry Run (Preview)
```bash
node apps/website/scripts/dkap-wire.mjs --dry-run --pretty
```

### Apply (Generate Config)
```bash
node apps/website/scripts/dkap-wire.mjs --apply --pretty
```

### Options
- `--root <path>`: Root directory to scan (default: `apps/website`)
- `--globs <patterns>`: File patterns to include (default: `**/*.md` `**/*.mdx`)
- `--apply`: Write `config.generated.yml` file
- `--pretty`: Pretty-print YAML output
- `--logLevel <level>`: Logging level (`debug`, `info`, `warn`, `error`)

## Generated Collections

The script automatically detects and creates collections for:

### About Pages
- **About (EN)**: Single file collection for English about page
- **About (RU)**: Single file collection for Russian about page

### Blog Collections
- **blog_en**: English blog posts from `src/content/en/blog/`
- **blog_posts**: Posts from `content/posts/`
- **blog_src_blog**: Posts from `src/content/blog/`
- **blog_src_posts**: Posts from `src/content/posts/`

## Running the CMS

1. Start the Decap CMS proxy server:
   ```bash
   npx decap-cms-proxy-server --port 8081
   ```

2. Open the admin interface:
   ```
   http://localhost:4321/website-admin/?config=/admin/config.generated.yml
   ```

3. Edit your content directly in the admin interface - changes are written to your markdown files.

## Custom Rules

You can customize content detection by creating `apps/website/scripts/dkap-wire.rules.json` with custom patterns and rules.

## Safety Features

- `create: false` and `delete: false` by default to prevent accidental content loss
- Only reads existing files, never modifies content structure
- Generates deterministic output with stable field ordering

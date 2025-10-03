# CMS Inventory Script

A read-only Node.js script that scans existing Markdown/MDX files, parses frontmatter, and generates a Decap CMS configuration proposal.

## Overview

This script analyzes your existing content structure and provides:
- Normalized content inventory
- Proposed Decap CMS configuration (collections + fields)
- JSON snapshot preview of target records
- YAML configuration snippets ready for Decap CMS

## Requirements

- Node.js ≥ 18
- ESM support (`.mjs` files)
- Cross-platform compatibility (Windows/Ubuntu)

## Installation

The required dependencies are already added to `package.json`:

```bash
npm install
```

## Usage

### Basic Usage

```bash
# Scan all content files
node scripts/cms-inventory.mjs

# Scan specific directory
node scripts/cms-inventory.mjs --root apps/website

# Use custom glob patterns
node scripts/cms-inventory.mjs --globs "src/content/**/*.md" "src/content/**/*.mdx"
```

### Advanced Options

```bash
# Generate YAML configuration snippet
node scripts/cms-inventory.mjs --yaml

# Filter collections (about, blog, all)
node scripts/cms-inventory.mjs --only about

# Limit files for faster processing
node scripts/cms-inventory.mjs --limit 10

# Pretty-print JSON output
node scripts/cms-inventory.mjs --pretty

# Enable debug logging
node scripts/cms-inventory.mjs --logLevel debug
```

### Cross-Platform Examples

**Ubuntu (bash):**
```bash
node scripts/cms-inventory.mjs \
  --root apps/website \
  --globs "**/*.md" "**/*.mdx" \
  --only all --pretty --yaml | tee cms-readonly-report.yml
```

**Windows (PowerShell):**
```powershell
node scripts/cms-inventory.mjs `
  --root apps/website `
  --globs "**/*.md" "**/*.mdx" `
  --only all --pretty --yaml | Tee-Object -FilePath cms-readonly-report.yml
```

## Output Format

### JSON Output

The script outputs a comprehensive JSON object with:

```json
{
  "meta": {
    "ts": "2025-10-03T13:24:03.137Z",
    "node": "v24.9.0",
    "root": "/path/to/website",
    "scanned": 30,
    "total": 30,
    "errors": 0
  },
  "inventory": [
    {
      "path": "src/content/aboutPage/en/about.md",
      "title": "About",
      "locale": "en",
      "route": "/en/about",
      "kind": "about_en",
      "hero": { "image": "...", "heading": "...", "subheading": "..." },
      "sections": [...],
      "images": [...],
      "tags": [...]
    }
  ],
  "proposedDecap": {
    "collections": [...],
    "configSnippetYaml": "# BEGIN: auto-cms-ro\n..."
  },
  "snapshotsPreview": {
    "about_en": { "title": "...", "locale": "en", ... },
    "about_ru": { "title": "...", "locale": "ru", ... }
  }
}
```

### YAML Output

When using `--yaml`, the script outputs a ready-to-use Decap CMS configuration:

```yaml
# BEGIN: auto-cms-ro
collections:
  - name: about_en
    label: About Page (EN)
    type: files
    files:
      - label: About Page EN
        name: about_en
        file: apps/website/src/cms-content/about_en.json
        fields:
          - name: title
            label: Title
            widget: string
          # ... more fields
# END: auto-cms-ro
```

## Content Detection

### About Pages

The script detects About pages based on:
- File path containing `about`
- Frontmatter `slug` containing `about`
- Locale detection from path (`/en/`, `/ru/`) or frontmatter

**Supported sections:**
- `hero` - Profile information, avatar, bio, links
- `skills` - Skills groups with icons and levels
- `experience` - Work experience with companies and roles
- `education` - Educational background
- `favorites` - Personal interests and recommendations

### Blog Posts

Blog posts are detected by:
- File path containing `blog` or `posts`
- Frontmatter containing `date`, `publishedAt`, or `tags`
- Route containing `/blog`

**Supported fields:**
- `title`, `date`, `description`, `tags`
- `draft`, `coverImage`, `body`
- Locale detection and routing

## Field Mapping

### Frontmatter Normalization

The script normalizes various frontmatter patterns:

| Original | Normalized | Description |
|----------|------------|-------------|
| `locale`, `lang`, `language` | `locale` | Language identifier |
| `route`, `permalink`, `slug`, `path` | `route` | URL path |
| `title`, `name`, `heading` | `title` | Page title |
| `hero.image`, `cover`, `image` | `hero.image` | Hero image |

### Image Extraction

Images are automatically extracted from:
- Markdown content (`![alt](url)`)
- Frontmatter fields (`avatar`, `cover`, `image`)
- Section data (`logo`, `avatar`)

## Validation

The script includes lightweight validation using Zod schemas:

- **About pages**: Validates section types and required fields
- **Blog posts**: Validates date formats and required metadata
- **Errors**: Reported in `meta.errors` with file paths and details

## Exit Codes

- `0` - Success
- `1` - Fatal error (file system, parsing)
- `2` - Validation errors (content structure issues)

## Safety Features

- **Read-only**: No file writes, moves, or deletions
- **No Git operations**: Pure content analysis
- **No network calls**: Offline operation
- **Deterministic output**: Consistent results across runs

## Integration with Decap CMS

The generated YAML can be directly integrated into your Decap CMS configuration:

1. Copy the YAML snippet from `configSnippetYaml`
2. Paste into your `admin/config.yml` under the `collections:` section
3. Adjust file paths and field configurations as needed
4. Test with Decap CMS local backend

## Troubleshooting

### Common Issues

**"Cannot find module" errors:**
- Ensure you're running from the correct directory
- Check that all dependencies are installed with `npm install`

**Validation errors:**
- Check date formats in frontmatter (should be strings, not Date objects)
- Verify required fields are present in About pages
- Review section structure matches expected schema

**Empty collections:**
- Verify file paths match your content structure
- Check glob patterns include your content files
- Use `--logLevel debug` to see file processing details

### Debug Mode

Enable debug logging to see detailed processing information:

```bash
node scripts/cms-inventory.mjs --logLevel debug
```

This will show:
- Files being processed
- Content type detection decisions
- Normalization steps
- Validation results

## Future Enhancements

This script is designed as a planning tool. Future enhancements could include:

- Write-mode migrator to actually create JSON files
- Integration with existing CMS workflows
- Support for additional content types
- Automated config.yml patching
- Content migration utilities

## License

This script is part of the website project and follows the same license terms.

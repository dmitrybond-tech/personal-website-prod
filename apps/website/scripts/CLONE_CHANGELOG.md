# RU Mirror from EN - Changelog

## Schema-Safe Clone Implementation

### Files Added

1. **apps/website/scripts/clone-en-about-to-ru.ts** (NEW)
   - Zero-surprise migrator that clones EN About entry to RU
   - Only mutation: slug becomes "ru/about"
   - All other fields remain exactly as in EN
   - Supports both JSON and MD formats
   - Comprehensive validation and error handling

2. **apps/website/package.json** (MODIFIED)
   - Added `migrate:ru:clone-en` script
   - Added `migrate:ru:clone-en:dry` script for dry runs

### Key Features Implemented

#### Format Detection
- ✅ **JSON Mode**: Detects `en/about.json` and treats as JSON
- ✅ **MD Mode**: Detects `en/about.md` and treats as frontmatter MD
- ✅ **Auto-detection**: Prioritizes JSON over MD if both exist

#### JSON Mode Cloning
- ✅ **Deep Clone**: Uses JSON.parse(JSON.stringify()) for safe cloning
- ✅ **Slug Mutation**: Changes slug from "en/about" to "ru/about"
- ✅ **Pretty Printing**: --pretty flag for 2-space indented JSON
- ✅ **Validation**: Ensures slug and sections exist

#### MD Mode Cloning
- ✅ **Frontmatter Parsing**: Robust parsing with delimiter validation
- ✅ **BOM Handling**: Removes UTF-8 BOM if present
- ✅ **Slug Mutation**: Regex-based slug replacement in frontmatter
- ✅ **Body Preservation**: Exact byte preservation of content body
- ✅ **Single Block**: Ensures exactly one frontmatter block

#### CLI Flags
- ✅ **--dry-run**: Preview changes without writing files
- ✅ **--force**: Overwrite existing RU file
- ✅ **--pretty**: Pretty-print JSON with 2 spaces
- ✅ **--debug**: Show first 8 lines of written file

#### Validation & Safety
- ✅ **Schema Validation**: Ensures slug="ru/about" and sections exist
- ✅ **Idempotency**: Safe to run multiple times
- ✅ **Error Handling**: Helpful error messages for common issues
- ✅ **UTF-8 Safety**: Proper encoding without BOM

### Usage Examples

#### Basic Usage
```bash
# Clone EN to RU (MD mode)
npm run migrate:ru:clone-en

# Dry run to preview changes
npm run migrate:ru:clone-en:dry

# Force overwrite existing RU file
npm run migrate:ru:clone-en -- --force
```

#### Advanced Usage
```bash
# Pretty-print JSON output
npm run migrate:ru:clone-en -- --pretty

# Debug mode with file preview
npm run migrate:ru:clone-en -- --debug

# Combined flags
npm run migrate:ru:clone-en -- --force --pretty --debug
```

### Console Output Examples

#### MD Mode (Dry Run)
```
[clone] Starting EN → RU About page clone...
[clone] Options: dry-run=true, force=false, pretty=false, debug=false
[clone] Source format: MD
[clone] Detected MD mode
[clone] 🔍 DRY RUN - Would write to ru/about.md:
--- MD DIFF ---
slug: "en/about" → "ru/about"
sections: 1 items
--- END DIFF ---
[clone] 📋 Result Summary:
[clone]   - Mode: MD
[clone]   - Source: en/about.md
[clone]   - Target: ru/about.md
[clone]   - Slug: "en/about" → "ru/about"
[clone]   - Sections: 1 items
[clone]   - Changes: 1 field(s)
[clone] 🔍 Dry run completed - no files written
```

#### JSON Mode (With Pretty)
```
[clone] Starting EN → RU About page clone...
[clone] Options: dry-run=false, force=true, pretty=true, debug=false
[clone] Source format: JSON
[clone] Detected JSON mode
[clone] 📋 Result Summary:
[clone]   - Mode: JSON
[clone]   - Source: en/about.json
[clone]   - Target: ru/about.json
[clone]   - Slug: "en/about" → "ru/about"
[clone]   - Sections: 1 items
[clone]   - Changes: 1 field(s)
[clone] ✅ Validation passed: slug="ru/about", sections=1
[clone] ✅ Clone completed successfully!
```

### Testing Results

- ✅ **MD Mode**: Successfully clones frontmatter with slug mutation
- ✅ **JSON Mode**: Successfully clones JSON with deep copy and slug mutation
- ✅ **Idempotency**: Running twice produces no changes
- ✅ **Validation**: All generated content passes schema validation
- ✅ **CLI Flags**: All flags work correctly
- ✅ **Error Handling**: Graceful handling of missing files and malformed content

### Acceptance Criteria Met

- ✅ **Byte-for-byte Clone**: RU file is identical to EN except for slug
- ✅ **Schema Compliance**: Generated content passes Astro validation
- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Format Support**: Works with both JSON and MD formats
- ✅ **CLI Flags**: All requested flags implemented and tested
- ✅ **No Unrelated Changes**: Only migration script and npm scripts modified

### Technical Implementation

#### Defensive Programming
- BOM removal for UTF-8 safety
- Frontmatter delimiter validation
- Graceful error handling with helpful messages
- Safe file operations with directory creation

#### Performance
- Minimal dependencies (no heavy YAML parsers)
- Simple regex-based parsing for common cases
- Efficient file I/O operations
- Fast validation checks

#### Maintainability
- Clear separation of JSON vs MD logic
- Comprehensive logging for debugging
- Type-safe implementation
- Self-contained script with no external dependencies

The implementation provides a robust, zero-surprise cloning mechanism that ensures schema compliance while maintaining exact content fidelity between EN and RU versions.

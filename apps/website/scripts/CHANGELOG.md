# Migration Changelog

## Schema-first Migration (DevsCard → Decap/Astro)

### Files Modified

1. **apps/website/scripts/migrate-one-skill.ts**
   - Complete rewrite with schema validation
   - Added Zod validation matching content.config.ts
   - Implemented CLI flags: --dry-run, --overwrite, --lang
   - Added idempotent merge logic
   - Fixed ESM import issues

2. **apps/website/scripts/migrate-devscard-to-decap.ts**
   - Complete rewrite with full DevsCard data migration
   - Dynamic import of DevsCard TS modules with fallback
   - Complete field mapping with validation
   - Added comprehensive error handling
   - Implemented all CLI flags

3. **apps/website/package.json**
   - Added `zod: 3.23.8` dependency
   - Added `js-yaml: 4.1.0` dependency
   - Existing npm scripts already present

4. **apps/website/scripts/MIGRATION_MAPPING.md** (NEW)
   - Comprehensive field mapping documentation
   - Schema analysis and constraints
   - Migration strategy and validation approach

5. **apps/website/scripts/MIGRATION_SUMMARY.md** (NEW)
   - Complete migration summary and usage guide
   - Validation results and technical details
   - Next steps and architecture notes

### Files Generated

6. **apps/website/src/content/aboutPage/en/about.md**
   - Generated with React skill data
   - Schema-compliant YAML frontmatter
   - Proper slug and section structure

7. **apps/website/src/content/aboutPage/ru/about.md**
   - Generated with React skill data (Russian)
   - Schema-compliant YAML frontmatter
   - Proper slug and section structure

### Key Changes

#### Schema Validation
- Replicated content.config.ts Zod schema in migration scripts
- Added comprehensive validation with helpful error messages
- Ensures all generated content passes Astro validation

#### Field Mapping
- **DevsCard → Target**: Complete mapping of all relevant fields
- **Ignored Fields**: iconColor and other DevsCard-specific fields
- **Default Values**: Proper handling of missing/optional fields

#### CLI Features
- `--dry-run`: Preview changes without writing files
- `--overwrite`: Replace existing skills section entirely
- `--lang=en,ru`: Migrate specific languages only

#### Idempotency
- Safe to run multiple times without duplicates
- Merge logic preserves existing sections
- Stable output for consistent results

#### Error Handling
- Fail-fast validation with detailed error messages
- Graceful handling of missing files or invalid data
- Helpful suggestions for fixing validation errors

### Dependencies Added
- `zod`: Schema validation library
- `js-yaml`: YAML parsing for existing content

### No Changes Made
- i18n routes and configuration
- Cal/bookme functionality
- Footer/layout components
- Dependencies (except added validation libraries)

### Testing Results
- ✅ Schema validation passes
- ✅ CLI flags work correctly
- ✅ Idempotent operations confirmed
- ✅ Field mapping accurate
- ✅ Error handling comprehensive
- ✅ Generated content valid

### Usage Commands
```bash
# Single skill migration
npm run migrate:one-skill
npm run migrate:one-skill -- --dry-run
npm run migrate:one-skill -- --overwrite --lang=en

# Full DevsCard migration
npm run migrate:devscard
npm run migrate:devscard -- --dry-run
npm run migrate:devscard -- --overwrite
```

### Next Steps
1. Test rendering with `npm run dev`
2. Review migrated content for accuracy
3. Customize skill descriptions and levels
4. Deploy to production

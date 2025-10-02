# Date Normalization Implementation - Change Log

## Overview
Enforced ISO date format (YYYY-MM-DD) at the CMS level to prevent Astro crashes on invalid dates. Changes were made to the Decap CMS configuration and added client-side date normalization.

## Changes Made

### 1. Updated CMS Configuration (`apps/website/public/website-admin/config.yml`)
**File:** `apps/website/public/website-admin/config.yml`
**Lines:** 53-58

**Before:**
```yaml
      - label: "Date"
        name: "date"
        widget: "datetime"
        format: "YYYY-MM-DD"
        time_format: false
        picker_utc: true
        i18n: false
```

**After:**
```yaml
      - label: "Date"
        name: "date"
        widget: "date"
        format: "YYYY-MM-DD"
        i18n: false
        pattern: ['^\\d{4}-\\d{2}-\\d{2}$', 'Use YYYY-MM-DD (e.g. 2025-10-02)']
```

**Changes:**
- Changed widget from `datetime` to `date` for simpler date-only input
- Removed `time_format: false` and `picker_utc: true` (not needed for date widget)
- Added `pattern` validation with regex `^\\d{4}-\\d{2}-\\d{2}$` to enforce ISO format
- Added user-friendly error message: "Use YYYY-MM-DD (e.g. 2025-10-02)"

### 2. Added Date Normalization Handler (`apps/website/public/website-admin/index.html`)
**File:** `apps/website/public/website-admin/index.html`
**Lines:** 29-84

**Added new script block:**
```javascript
<script>
  // Date normalization preSave handler
  (function () {
    const T = setInterval(() => {
      if (!window.CMS) return;
      try {
        // Register preSave handler for date normalization
        window.CMS.registerEventListener({
          name: 'preSave',
          handler: ({ entry }) => {
            if (entry && entry.data && entry.data.date) {
              let dateValue = entry.data.date;
              
              // Replace typographic dashes with regular dashes
              dateValue = dateValue.replace(/[–—]/g, '-');
              
              // Convert various date formats to YYYY-MM-DD
              const datePatterns = [
                // DD.MM.YYYY
                /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
                // DD/MM/YYYY
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
                // DD-MM-YYYY
                /^(\d{1,2})-(\d{1,2})-(\d{4})$/
              ];
              
              for (const pattern of datePatterns) {
                const match = dateValue.match(pattern);
                if (match) {
                  const [, day, month, year] = match;
                  const paddedDay = day.padStart(2, '0');
                  const paddedMonth = month.padStart(2, '0');
                  dateValue = `${year}-${paddedMonth}-${paddedDay}`;
                  break;
                }
              }
              
              // Validate the final date format
              const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
              if (isoDatePattern.test(dateValue)) {
                entry.data.date = dateValue;
                console.info('[DATE NORMALIZATION] Normalized date to:', dateValue);
              } else {
                console.warn('[DATE NORMALIZATION] Invalid date format:', entry.data.date);
              }
            }
          }
        });
        
        clearInterval(T);
      } catch (e) {
        console.error('[DATE NORMALIZATION] Error registering preSave handler:', e);
      }
    }, 500);
  })();
</script>
```

**Features:**
- Registers a `preSave` event listener that runs before saving any entry
- Normalizes typographic dashes (–, —) to regular dashes (-)
- Converts common date formats to ISO format:
  - DD.MM.YYYY → YYYY-MM-DD
  - DD/MM/YYYY → YYYY-MM-DD  
  - DD-MM-YYYY → YYYY-MM-DD
- Validates final date format with ISO pattern
- Provides console logging for debugging
- Handles errors gracefully

## Technical Details

### Date Format Conversion Examples
- `25.12.2024` → `2024-12-25`
- `1/1/2025` → `2025-01-01`
- `15-3-2024` → `2024-03-15`
- `2024–12–25` (typographic dashes) → `2024-12-25`

### Validation
- CMS-level validation: Regex pattern `^\\d{4}-\\d{2}-\\d{2}$`
- Client-side validation: Same pattern applied after normalization
- User-friendly error messages guide correct format usage

### Error Handling
- Invalid dates are logged as warnings but don't prevent saving
- Handler errors are caught and logged to console
- Graceful fallback if CMS is not available

## Impact
- Prevents Astro build crashes from invalid date formats
- Improves user experience with automatic date normalization
- Maintains backward compatibility with existing date formats
- Provides clear validation feedback to content editors

## Files Modified
1. `apps/website/public/website-admin/config.yml` - CMS configuration
2. `apps/website/public/website-admin/index.html` - Client-side normalization

## Testing Recommendations
1. Test with various date formats in the CMS
2. Verify ISO format enforcement
3. Check console logs for normalization messages
4. Confirm Astro builds successfully with normalized dates
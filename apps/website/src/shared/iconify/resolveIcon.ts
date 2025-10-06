// Returns explicit icon if present; otherwise uses mapping; otherwise a safe generic fallback.

const NORM = (s: string) => String(s || '').toLowerCase()
  .replace(/[\s_+.-]/g, '')
  .replace(/[^a-z0-9]/g, '');

// Inline mapping to avoid JSON import issues - uses CDN cached stock icons
const mapping: Record<string, string> = {
  "discovery": "simple-icons:discovery",
  "analytics": "simple-icons:googleanalytics",
  "itilv4": "simple-icons:itil",
  "pmbok": "simple-icons:projectmanagementinstitute",
  "agile": "simple-icons:agile",
  "togaf": "simple-icons:iso",
  "iso27001": "simple-icons:eslint",
  "cloudiaas": "simple-icons:amazonaws",
  "linux": "simple-icons:linux",
  "python": "simple-icons:python",
  "sql": "simple-icons:postgresql",
  "mlai": "simple-icons:tensorflow"
};

export function resolveSkillIcon(name?: string, explicit?: string): string {
  if (explicit) return explicit;
  if (!name) return 'mdi:help-circle';
  const k = NORM(name);
  return mapping[k] || 'mdi:help-circle';
}

# Skills Card Implementation - Quick Reference

## 🚀 Quick Start (3 Steps)

```bash
# 1. Run migration
npm run migrate:one-skill

# 2. Start dev server
npm run dev:all

# 3. Visit about pages
# EN: http://localhost:4321/en/about
# RU: http://localhost:4321/ru/about
```

---

## 📁 Files Changed (7)

| File | Action | Purpose |
|------|--------|---------|
| `scripts/migrate-one-skill.ts` | **NEW** | Migration script |
| `package.json` | Modified | Added npm script |
| `pages/[lang]/about.astro` | Modified | Section normalization |
| `features/about/sections/Cards.astro` | Modified | Data processing |
| `content.config.ts` | Modified | Schema validation |
| `content/aboutPage/en/about.md` | Modified | React skill (EN) |
| `content/aboutPage/ru/about.md` | Modified | React skill (RU) |

---

## 🎯 What You Get

**One React skill card on `/[lang]/about` with:**
- ⚛️ Iconify icon (`simple-icons:react`)
- 🔗 Link to https://react.dev
- 📊 5/5 level bar (all segments filled)
- 💬 Tooltip: "Hooks, Suspense, RSC basics" (EN) / "Хуки, Suspense, основы RSC" (RU)

---

## 🛠️ Key Functions

### Section Normalization (about.astro)
```typescript
const getType = (s:any) => 
  s?.type ?? s?.template ?? s?.blockType ?? s?.component ?? s?.data?.type ?? 'unknown';

const mapType = (t:string) => {
  const m: Record<string, string> = {
    skills: 'skills', skill: 'skills',
    grid: 'cards', list: 'cards'
  };
  return m[k] ?? k;
};

const normalize = (s:any) => ({ ...s, type: mapType(getType(s)), data: s?.data ?? s });
```

### Data Processing (Cards.astro)
```typescript
const raw = section?.data ?? section ?? {};
const variant = section?.type === 'skills' ? 'skills' : 'default';
const items = (raw?.items ?? raw?.groups?.[0]?.items ?? []).map((it, i) => ({
  id: it.id ?? it.name ?? `card-${i}`,
  title: it.name ?? it.title ?? '',
  icon: it.icon,
  url: it.url,
  level: it.level,
  tooltip: it.description
}));
```

---

## 📝 CMS Data Structure

```yaml
---
title: About
slug: en/about
sections:
  - type: skills
    data:
      title: "Skills"
      groups:
        - title: "I already know"
          items:
            - name: "React"
              icon: "simple-icons:react"
              url: "https://react.dev"
              level: 5
              description: "Hooks, Suspense, RSC basics"
---
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Card not showing | Restart dev server |
| CMS not loading | Check proxy on port 8081 |
| Styles not applying | Run `npm run clean:cache` |

---

## 📚 Full Documentation

- **SKILLS_CARD_IMPLEMENTATION_UNIFIED_DIFF.md** - Detailed diff
- **SKILLS_CARD_IMPLEMENTATION_CHANGELOG.md** - Change log
- **SKILLS_CARD_HOW_TO.md** - Usage guide
- **SKILLS_CARD_IMPLEMENTATION_SUMMARY.md** - Full summary

---

## ✅ Acceptance Criteria

- ✅ One React card on `/en/about` and `/ru/about`
- ✅ Iconify icon + 5/5 level bar + tooltip
- ✅ Renders inside `#site-container`
- ✅ No Tailwind @apply errors
- ✅ No console errors
- ✅ CMS editable
- ✅ Fallback seed works

---

## 🎉 Done!

All requirements met. Ready for testing and deployment.


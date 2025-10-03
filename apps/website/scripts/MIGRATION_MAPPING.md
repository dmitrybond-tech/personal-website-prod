# DevsCard → Decap/Astro Migration Mapping

## Schema Analysis

### Target Schema (content.config.ts)
```typescript
aboutPage: {
  title: string (required)
  slug: string (required) 
  sections: Array<{
    type: string
    data: {
      title?: string
      groups?: Array<{
        title: string
        items: Array<{
          name: string (required)
          icon?: string
          url?: string  
          level?: number (1-5)
          description?: string
        }>
      }>
      items?: Array<{...}> // Alternative flat structure
    }
  }>
}
```

### Donor Schema (DevsCard)
```typescript
SkillsSection: {
  config: {
    title: string
    slug: string
    icon: string
    visible: boolean
  }
  skillSets: Array<{
    title: string
    skills: Array<Skill | LevelledSkill>
  }>
}

Skill: {
  name: string
  icon?: string
  iconColor?: string (ignored)
  url?: string
  description?: string
}

LevelledSkill: Skill & {
  level: number (1-5)
}
```

## Field Mapping

### Donor → Target (aboutPage.sections[].type === 'skills')

**Section Level:**
- `config.title` → `data.title`
- `skillSets` → `data.groups`

**Group Level:**
- `title` → `title` (direct mapping)

**Item Level:**
- `name` → `name` (required)
- `icon` → `icon` (Iconify name, string)
- `url` → `url` (string, optional)
- `level` → `level` (int 1..5, optional but recommended for "I already know")
- `description` → `description` (tooltip, string, optional)

**Ignored Fields:**
- `iconColor` (DevsCard specific, not in target schema)
- `config.slug`, `config.icon`, `config.visible` (section metadata, not content)

## i18n Behavior

- **EN source of truth**: Primary content in English
- **RU mirrors**: Explicit Russian translations for all user-facing strings
- **Structure**: Both locales use identical data structure, only string content differs

## Migration Strategy

### Missing Fields Handling
- `level`: Default to undefined (omit) for "I want to learn" and "I speak" groups
- `description`: Default to undefined (omit) if not provided
- `url`: Default to undefined (omit) if not provided
- `icon`: Default to undefined (omit) if not provided

### Unknown Donor Fields
- Log warning and ignore: `iconColor`, `config.*` (except title)
- Preserve in comments for future reference

### Validation Errors
- Fail fast with detailed error messages
- Print diff showing what was expected vs received
- Suggest specific fixes for common issues

### Idempotency
- Use stable merge logic based on `name` field
- Replace existing skills section entirely when `--overwrite` flag used
- Preserve other sections when merging

## Example Transformation

**DevsCard Input:**
```typescript
{
  config: { title: "Skills", slug: "skills", icon: "fa6-solid:bars-progress", visible: true },
  skillSets: [
    {
      title: "I already know",
      skills: [
        react({ level: 5, description: "Hooks, Suspense, RSC basics" })
      ]
    }
  ]
}
```

**Target Output:**
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
              url: "https://reactjs.org/"
              level: 5
              description: "Hooks, Suspense, RSC basics"
---
```

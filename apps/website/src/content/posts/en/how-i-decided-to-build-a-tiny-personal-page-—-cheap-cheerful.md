---
title: How I Decided to Build a Tiny Personal Page — Cheap & Cheerful
slug: cheap-and-cheerful-personal-page
date: 2025-10-12
description: "A quick MVP of a personal page: vibe-coding + FSD + i18n with
  Astro, Decap CMS, Docker, Caddy, and GitHub Actions. Fast, simple, and tidy."
tags:
  - astro
cover: /uploads/cover-post1.jpg
draft: false
---
## Why this and why like this 🧭
This was a **for-fun** build to test **vibe-coding**: fast iterations guided by feel, where *validating ideas quickly* matters more than pristine architecture. I kept it tidy though: **FSD** (Feature-Sliced Design) to structure the codebase and **i18n** to mirror RU/EN content. The result is a tiny, shippable MVP that can grow without tears.

## What’s inside 🧩
- **Astro + Tailwind** — static rendering, tokenized theming, tiny bundles.
- **Content — Markdown + Decap CMS** (GitHub backend, OAuth): edits are commits.
- **i18n** — mirrored collections: `posts/ru` and `posts/en`.
- **FSD** — layers/features/slices reduce coupling and duplication.
- **CI/CD** — GitHub Actions → Docker Buildx → GHCR → VPS.
- **Caddy** — TLS and reverse proxy.
- A bit of **agents** 🤖 — for scaffolding, config stubs, and boilerplate drafts.

## Key takeaways ⚡
- **You can ship an MVP fast**: Astro + Markdown + Decap cover blogging and pages out of the box.  
- **Agents smooth the learning curve** for a new framework: scaffolds, migrations, draft tests.  
- **Caveat**: agents can **over-engineer** — extra scripts/helpers, noisy pipelines, DRY violations. That **hurts scalability** and clarity. Counter it with reviews, linters, guardrails on auto-gen paths, and periodic cleanup.  
- **FSD + i18n** enforce discipline: mirrored locales and isolated features make refactoring safer.  
- **Tech debt** will appear anyway — schedule architectural pit stops every few iterations.

## What’s next 🚧
I’m keen to explore:  
- **Auto-generating profile pages** via a LinkedIn-style **RAG** pipeline 🧠📄;  
- More **automation**: post templates, PR preview envs, auto-tagging;  
- A public release with a lightweight **monetization** layer (pay-what-you-want / micro-subscription).  

If that sounds interesting, I can polish docs, add features, and open up parts of the pipeline. ✨

## Bottom line 🎯
A small project makes a great lab: I validated the stack, paired **FSD+i18n**, and tried **vibe-coding with agents**. Stay critical of auto-gen and keep architecture hygienic, and “fast & frugal” becomes “fast & resilient.” 💪

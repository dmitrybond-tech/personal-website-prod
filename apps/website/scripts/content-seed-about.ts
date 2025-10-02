#!/usr/bin/env tsx

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(new URL(import.meta.url)));
const projectRoot = join(__dirname, '..');
const refRoot = join(projectRoot, '..', 'website-vanilla_ref');

interface SeedOptions {
  force?: boolean;
  verbose?: boolean;
}

function log(message: string, verbose = false) {
  if (verbose) {
    console.log(`[SEED] ${message}`);
  }
}

function seedAboutContent(locale: 'en' | 'ru', options: SeedOptions = {}) {
  const { force = false, verbose = false } = options;
  
  log(`Seeding about content for ${locale}`, verbose);
  
  // Source paths
  const refMainPath = join(refRoot, 'src', 'content', locale, 'main.ts');
  const refAssetsPath = join(refRoot, 'src', 'assets', 'devscard');
  
  // Target paths
  const targetAboutPath = join(projectRoot, 'src', 'content', 'aboutPage', locale, 'about.mdx');
  const targetAssetsPath = join(projectRoot, 'src', 'content', locale, 'assets');
  
  // Check if source exists
  if (!existsSync(refMainPath)) {
    console.warn(`[SEED] Source file not found: ${refMainPath}`);
    return;
  }
  
  // Check if target exists and force is not set
  if (existsSync(targetAboutPath) && !force) {
    console.log(`[SEED] Target file exists, skipping: ${targetAboutPath} (use --force to overwrite)`);
    return;
  }
  
  try {
    // Read reference data
    const refContent = readFileSync(refMainPath, 'utf-8');
    
    // Extract data using simple regex (basic implementation)
    const fullNameMatch = refContent.match(/fullName:\s*['"`]([^'"`]+)['"`]/);
    const roleMatch = refContent.match(/role:\s*['"`]([^'"`]+)['"`]/);
    const descriptionMatch = refContent.match(/description:\s*['"`]([^'"`]+)['"`]/);
    const imageMatch = refContent.match(/image:\s*['"`]([^'"`]+)['"`]/);
    
    const fullName = fullNameMatch?.[1] || (locale === 'ru' ? 'Дмитрий Б.' : 'Dmitry B.');
    const role = roleMatch?.[1] || (locale === 'ru' ? 'Senior Full-Stack разработчик' : 'Senior Full-Stack Developer');
    const description = descriptionMatch?.[1] || (locale === 'ru' ? 'Опытный full-stack разработчик' : 'Experienced full-stack developer');
    const image = imageMatch?.[1] || '/assets/my-image.jpeg';
    
    // Generate MDX content
    const title = locale === 'ru' ? 'Обо мне' : 'About me';
    const lead = description;
    
    const mdxContent = `---
title: "${title}"
lead: "${lead}"
sections:
  - heading: "${role}"
    icon: "fa6-solid:user"
    body: "${description}"
    image: "${image}"
links:
  - label: "GitHub"
    url: "https://github.com/dmitry"
    icon: "fa6-brands:github"
  - label: "LinkedIn"
    url: "https://linkedin.com/in/dmitry"
    icon: "fa6-brands:linkedin"
  - label: "Email"
    url: "mailto:dmitry@example.com"
    icon: "fa6-solid:envelope"
cv_pdf: "/cv_${locale}/cv.pdf"
gallery:
  - "/assets/project-1.jpeg"
  - "/assets/project-2.jpeg"
  - "/assets/project-3.jpeg"
---

# ${title}

${lead}

## My Journey

I started my development journey over 8 years ago and have since worked on a wide variety of projects, from small startups to large enterprise applications.

## What I Do

- **Full-Stack Development**: Building complete web applications
- **Mentoring**: Helping other developers grow
- **Open Source**: Contributing to various projects
- **Consulting**: Providing technical expertise

## Let's Connect

I'm always interested in discussing new opportunities and collaborating on exciting projects.`;
    
    // Ensure target directory exists
    mkdirSync(dirname(targetAboutPath), { recursive: true });
    
    // Write MDX file
    writeFileSync(targetAboutPath, mdxContent);
    log(`Created: ${targetAboutPath}`, verbose);
    
    // Copy assets if source exists
    if (existsSync(refAssetsPath)) {
      mkdirSync(targetAssetsPath, { recursive: true });
      
      // Copy main image
      const refImagePath = join(refAssetsPath, 'my-image.jpeg');
      if (existsSync(refImagePath)) {
        const targetImagePath = join(targetAssetsPath, 'my-image.jpeg');
        copyFileSync(refImagePath, targetImagePath);
        log(`Copied image: ${targetImagePath}`, verbose);
      }
      
      // Copy portfolio images
      const portfolioPath = join(refAssetsPath, 'portfolio');
      if (existsSync(portfolioPath)) {
        // This would need more complex logic to copy multiple files
        log(`Portfolio assets found at: ${portfolioPath}`, verbose);
      }
    }
    
    console.log(`✅ Seeded about content for ${locale}`);
    
  } catch (error) {
    console.error(`❌ Failed to seed about content for ${locale}:`, error);
  }
}

// CLI handling
const args = process.argv.slice(2);
const force = args.includes('--force');
const verbose = args.includes('--verbose');
const locales = args.filter(arg => arg === 'en' || arg === 'ru');

const options = { force, verbose };

if (locales.length === 0) {
  // Seed both locales if none specified
  seedAboutContent('en', options);
  seedAboutContent('ru', options);
} else {
  // Seed specified locales
  locales.forEach(locale => seedAboutContent(locale as 'en' | 'ru', options));
}

console.log('About content seeding completed!');
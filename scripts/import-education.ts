#!/usr/bin/env tsx

/**
 * Education Import Script
 * 
 * This script finds/creates the education section in en/ru/about.md files
 * and updates the data.items payload with the new institution structure.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const EN_ABOUT_PATH = 'apps/website/src/content/aboutPage/en/about.md';
const RU_ABOUT_PATH = 'apps/website/src/content/aboutPage/ru/about.md';

// Education data for EN
const EN_EDUCATION_DATA = {
  title: 'Education',
  items: [
    {
      school: 'Siberian State University of Telecommunications and Information Sciences (SibSUTIS)',
      location: 'Novosibirsk, Russia',
      url: 'https://www.sibsutis.ru',
      logo: '/logos/sibsutis.svg',
      degrees: [
        {
          degree: 'BSc',
          program: 'Information and Computing Technology',
          faculty: 'Faculty of Computer Science and Engineering',
          period: 'Sep 2012 – Sep 2016',
          bullets: [
            'Focused on software engineering, algorithms, and data structures',
            'Participated in multiple hackathons and coding competitions',
            'Dean\'s List for 6 consecutive semesters',
            '1st place in University Hackathon 2015',
            'President of Computer Science Club'
          ]
        }
      ]
    }
  ]
};

// Education data for RU
const RU_EDUCATION_DATA = {
  title: 'Образование',
  items: [
    {
      school: 'Сибирский государственный университет телекоммуникаций и информатики (СибГУТИ)',
      location: 'Новосибирск, Россия',
      url: 'https://www.sibsutis.ru',
      logo: '/logos/sibsutis.svg',
      degrees: [
        {
          degree: 'Бакалавр',
          program: 'Информационные и вычислительные технологии',
          faculty: 'Факультет компьютерных наук и инженерии',
          period: 'сен 2012 – сен 2016',
          bullets: [
            'Сосредоточился на программной инженерии, алгоритмах и структурах данных',
            'Участвовал в множественных хакатонах и соревнованиях по программированию',
            'Список декана в течение 6 семестров подряд',
            '1 место в университетском хакатоне 2015',
            'Президент клуба компьютерных наук'
          ]
        }
      ]
    }
  ]
};

function updateEducationSection(filePath: string, educationData: any) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Parse YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      console.error(`No frontmatter found in ${filePath}`);
      return;
    }
    
    const [, frontmatter, body] = frontmatterMatch;
    
    // Parse sections array
    const sectionsMatch = frontmatter.match(/sections:\s*\n((?:  - .*\n)*)/);
    if (!sectionsMatch) {
      console.error(`No sections found in ${filePath}`);
      return;
    }
    
    // Find education section and replace it
    const sectionsText = sectionsMatch[1];
    const educationSectionRegex = /  - type: education\s*\n(?:    data:\s*\n(?:      .*\n)*)/g;
    
    const newEducationSection = `  - type: education
    data:
      title: ${educationData.title}
      items:
        - school: ${educationData.items[0].school}
          location: ${educationData.items[0].location}
          url: ${educationData.items[0].url}
          logo: ${educationData.items[0].logo}
          degrees:
            - degree: ${educationData.items[0].degrees[0].degree}
              program: ${educationData.items[0].degrees[0].program}
              faculty: ${educationData.items[0].degrees[0].faculty}
              period: ${educationData.items[0].degrees[0].period}
              bullets:
${educationData.items[0].degrees[0].bullets.map((bullet: string) => `                - ${bullet}`).join('\n')}
`;
    
    let newSectionsText = sectionsText;
    if (educationSectionRegex.test(sectionsText)) {
      newSectionsText = sectionsText.replace(educationSectionRegex, newEducationSection);
    } else {
      // Add education section if it doesn't exist
      newSectionsText = sectionsText + newEducationSection;
    }
    
    const newFrontmatter = frontmatter.replace(sectionsMatch[0], `sections:\n${newSectionsText}`);
    const newContent = `---\n${newFrontmatter}\n---\n${body}`;
    
    writeFileSync(filePath, newContent, 'utf-8');
    console.log(`✅ Updated education section in ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error);
  }
}

// Main execution
console.log('🚀 Starting education import...');

updateEducationSection(EN_ABOUT_PATH, EN_EDUCATION_DATA);
updateEducationSection(RU_ABOUT_PATH, RU_EDUCATION_DATA);

console.log('✨ Education import completed!');

#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

const root = path.join(process.cwd(), 'apps/website');

// EN Experience data
const EN_ITEMS = [
  {
    company: "CloudBlue",
    location: "Enschede, the Netherlands",
    url: "https://www.cloudblue.com",
    logo: "/logos/cloudblue.svg",
    roles: [
      {
        title: "Delivery Manager",
        period: "Mar 2023 – Apr 2025",
        bullets: [
          "Led partner enablement and post-launch support across a cloud-based commerce platform.",
          "Managed delivery of integration projects, advised on product configuration and SaaS monetization strategies.",
          "Coordinated cross-functional teams to drive scalable solution adoption and improve partner experience.",
          "Contributed to platform transformation initiatives, including migration, new microservices adoption and e-Commerce platform development."
        ]
      }
    ]
  },
  {
    company: "Datacom",
    location: "Kuala Lumpur, Malaysia",
    url: "https://datacom.com",
    logo: "/logos/datacom.svg",
    roles: [
      {
        title: "Business Consultant",
        period: "Jun 2019 – Mar 2023",
        bullets: [
          "Provided strategic and operational support across managed services operations, acting as a subject matter expert on platform processes and best practices.",
          "Led internal knowledge transfer and enablement initiatives, supporting global teams in adopting productized workflows and ITIL-based operations (Problem & Change Management).",
          "Drove process improvements with key partners to improve incident handling, reduce backlog, and strengthen SLA adherence.",
          "Played a central role in platform enablement, bridging product knowledge and day-to-day operational excellence."
        ]
      },
      {
        title: "Lead Technical Account Manager",
        period: "Jun 2019 – Mar 2023",
        bullets: [
          "Acted as strategic liaison between enterprise clients and internal teams, supporting cloud platform optimization, managed services delivery, and partner success initiatives.",
          "Led technical account operations, coordinated escalations, and enabled cross-functional collaboration across support, product, and delivery teams.",
          "Drove process improvements, change management, and contract optimization across multiple regions.",
          "Advised clients on platform usage, roadmaps, and upgrade planning; conducted stakeholder reviews and supported product adoption.",
          "Contributed to retention and recovery of at-risk accounts through on-site consulting and tailored solution design."
        ]
      }
    ]
  },
  {
    company: "CloudBlue",
    location: "Novosibirsk, Russia",
    url: "https://www.cloudblue.com",
    logo: "/logos/cloudblue.svg",
    roles: [
      {
        title: "Technical Account Manager",
        period: "Jun 2018 – Jun 2019",
        bullets: [
          "Supported telecom and hosting providers in operating and scaling cloud business through XaaS platform solutions.",
          "Coordinated upgrade and migration projects, provided technical account oversight, and facilitated incident resolution with cross-regional support.",
          "Improved internal workflows, knowledge management, and customer success initiatives.",
          "Assisted revenue recovery/remediation by re-engaging dormant enterprise clients via technical enablement and platform upgrades."
        ]
      }
    ]
  },
  {
    company: "Implementation Engineer — Banking Projects",
    location: "Novosibirsk, Russia",
    logo: "/logos/banking.svg",
    roles: [
      {
        title: "Implementation Engineer",
        period: "Sep 2016 – Jun 2018",
        bullets: [
          "Delivered end-to-end implementation of core banking systems and satellite modules: deployment, configuration, SIT/UAT coordination, and post-launch support.",
          "Translated business requirements into technical specifications in collaboration with front office, IT, and compliance stakeholders.",
          "Prepared SRS and localized technical materials; contributed to international rollout across Southeast Asia.",
          "Acted as QA lead during acceptance and mentored junior engineers within the implementation team."
        ]
      }
    ]
  }
];

// RU Experience data
const RU_ITEMS = [
  {
    company: "CloudBlue",
    location: "Энсхеде, Нидерланды",
    url: "https://www.cloudblue.com",
    logo: "/logos/cloudblue.svg",
    roles: [
      {
        title: "Delivery Manager",
        period: "мар 2023 – апр 2025",
        bullets: [
          "Руководил enablement-инициативами партнёров и поддержкой после запуска на облачной коммерческой платформе.",
          "Управлял поставкой интеграционных проектов, консультировал по конфигурации продукта и стратегиям монетизации SaaS.",
          "Координировал кросс-функциональные команды для масштабируемого внедрения решений и улучшения опыта партнёров.",
          "Участвовал в трансформации платформы: миграции, внедрении микросервисов и развитии e-commerce функционала."
        ]
      }
    ]
  },
  {
    company: "Datacom",
    location: "Куала-Лумпур, Малайзия",
    url: "https://datacom.com",
    logo: "/logos/datacom.svg",
    roles: [
      {
        title: "Business Consultant",
        period: "июн 2019 – мар 2023",
        bullets: [
          "Оказывал стратегическую и операционную поддержку процессов managed services, выступая экспертом по платформенным практикам.",
          "Вёл инициативы по передаче знаний и enablement, помогая глобальным командам внедрять продуктовые пайплайны и ITIL-процессы (Problem/Change).",
          "Совместно с партнёрами улучшал процессы: быстрее инциденты, меньше бэклога, выше соблюдение SLA.",
          "Играл ключевую роль в платформенном enablement, соединяя продуктовые знания и повседневную операционную эффективность."
        ]
      },
      {
        title: "Lead Technical Account Manager",
        period: "июн 2019 – мар 2023",
        bullets: [
          "Стратегический мост между enterprise-клиентами и внутренними командами: оптимизация облачной платформы, managed-услуги и успех партнёров.",
          "Руководил операциями TAM, координировал эскалации и кросс-функциональное взаимодействие поддержки, продукта и доставки.",
          "Продвигал улучшения процессов, управление изменениями и оптимизацию контрактов в нескольких регионах.",
          "Консультировал по использованию платформы, дорожным картам и планированию апгрейдов; проводил обзоры со стейкхолдерами и поддерживал внедрение продукта.",
          "Способствовал удержанию и восстановлению рисковых аккаунтов через onsite-консалтинг и адаптированный дизайн решений."
        ]
      }
    ]
  },
  {
    company: "CloudBlue",
    location: "Новосибирск, Россия",
    url: "https://www.cloudblue.com",
    logo: "/logos/cloudblue.svg",
    roles: [
      {
        title: "Technical Account Manager",
        period: "июн 2018 – июн 2019",
        bullets: [
          "Поддерживал телеком- и хостинг-провайдеров в развитии облачного бизнеса на XaaS-платформе.",
          "Координировал апгрейды и миграции, обеспечивал технический надзор аккаунтов и содействовал в инцидент-менеджменте.",
          "Улучшал внутренние процессы, базу знаний и инициативы customer success.",
          "Участвовал в восстановлении выручки и реанимации «спящих» клиентов через enablement и апгрейды."
        ]
      }
    ]
  },
  {
    company: "Implementation Engineer — банковские проекты",
    location: "Новосибирск, Россия",
    logo: "/logos/banking.svg",
    roles: [
      {
        title: "Implementation Engineer",
        period: "сен 2016 – июн 2018",
        bullets: [
          "Полный цикл внедрения ядра и модулей: деплой, конфигурация, координация SIT/UAT и поддержка после запуска.",
          "Совместно со стейкхолдерами (фронт-офис, ИТ, комплаенс) переводил бизнес-требования в технические спецификации.",
          "Готовил документацию (SRS), локализованные материалы; участвовал в международном развёртывании в ЮВА.",
          "Выступал QA-лидом на приёмке и менторил младших инженеров команды."
        ]
      }
    ]
  }
];

function updateMD(lang: 'en' | 'ru', items: any[]) {
  const file = path.join(root, `src/content/aboutPage/${lang}/about.md`);
  
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    return;
  }

  console.log(`Updating ${lang} experience section...`);
  
  const content = fs.readFileSync(file, 'utf-8');
  const fm = matter(content);
  
  const sections = fm.data.sections ?? [];
  const idx = sections.findIndex((s: any) => s?.type === 'experience');
  
  const next = { 
    type: 'experience', 
    data: { 
      title: lang === 'ru' ? 'Опыт' : 'Experience', 
      items 
    } 
  };
  
  if (idx === -1) {
    sections.push(next);
    console.log(`Added new experience section at index ${sections.length - 1}`);
  } else {
    console.log(`Replacing experience section at index ${idx}`);
    sections[idx] = next;
  }
  
  fm.data.sections = sections;
  
  const updated = matter.stringify(fm.content, fm.data);
  fs.writeFileSync(file, updated);
  
  console.log(`✅ Updated ${lang} experience section with ${items.length} companies`);
  console.log(`   First company: ${items[0]?.company}`);
}

// Main execution
console.log('🚀 Starting experience data import...');

try {
  updateMD('en', EN_ITEMS);
  updateMD('ru', RU_ITEMS);
  
  console.log('✅ Experience data import completed successfully!');
} catch (error) {
  console.error('❌ Error during import:', error);
  process.exit(1);
}

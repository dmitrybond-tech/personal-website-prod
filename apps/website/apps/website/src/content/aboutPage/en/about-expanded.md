---
title: About
slug: en/about
sections:
  # === MAIN SECTION ===
  - type: main
    data:
      title: Profile
      slug: profile
      icon: fa6-solid:user
      visible: true
      fullName: Mark Freeman
      role: Senior React Developer
      image: /devscard/my-image.jpeg
      description: |
        Lorem ipsum dolor sit amet, consectetur **adipiscing elit**. In sodales ac dui at *vestibulum*. In condimentum metus id dui tincidunt, in blandit mi [vehicula](/). Nulla lacinia, erat sit amet elementum vulputate, lectus mauris volutpat mi, vitae accumsan metus elit ut nunc. Vestibulum lacinia enim eget eros fermentum scelerisque. Proin augue leo, posuere ut imperdiet vitae, fermentum eu ipsum. Sed sed neque sagittis, posuere urna nec, commodo leo. Pellentesque posuere justo vitae massa volutpat maximus.
      details:
        - label: Phone
          value: 605 475 6961
          url: tel:605 475 6961
        - label: Email
          value: mark.freeman.dev@gmail.com
          url: mailto:mark.freeman.dev@gmail.com
        - label: From
          value: Warsaw, Poland
        - label: Salary range
          value: 18 000 - 25 000 PLN
      tags:
        - name: Open for freelance
        - name: Available for mentoring
        - name: Working on side project
      action:
        label: Download CV
        url: /devscard/cv.pdf
        downloadedFileName: CV-Mark_Freeman.pdf
      links:
        - label: Facebook
          url: "#"
          icon: fa6-brands:facebook
          color: "#1877F2"
        - label: GitHub
          url: "#"
          icon: fa6-brands:github
          color: "#181717"
        - label: LinkedIn
          url: "#"
          icon: fa6-brands:linkedin
          color: "#0A66C2"
        - label: Twitter
          url: "#"
          icon: fa6-brands:twitter
          color: "#1DA1F2"

  # === SKILLS SECTION ===
  - type: skills
    data:
      title: Skills
      slug: skills
      icon: fa6-solid:bars-progress
      visible: true
      skillSets:
        - title: I already know
          skills:
            - name: React
              icon: fa6-brands:react
              level: 5
              description: Proin ut erat sed massa tempus suscipit. Mauris efficitur nunc sem, nec scelerisque ligula bibendum ut.
            - name: TypeScript
              icon: fa6-brands:typescript
              level: 4
              description: Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.
            - name: Sass
              icon: fa6-brands:sass
              level: 4
              description: Nulla interdum pellentesque ultricies. Ut id eros commodo, ultrices ligula eu, elementum ante.
            - name: Chakra UI
              icon: simple-icons:chakraui
              level: 5
            - name: Tailwind CSS
              icon: fa6-brands:css3-alt
              level: 3
            - name: Prettier
              icon: fa6-brands:prettier
              level: 5
            - name: ESLint
              icon: fa6-brands:eslint
              level: 4
              description: Nulla tempor turpis at vehicula pharetra. Vestibulum tellus tortor, commodo et suscipit id, lobortis id nunc.
            - name: NestJS
              icon: fa6-brands:node-js
              level: 3
              description: Praesent feugiat ultricies iaculis. In posuere vehicula odio, sed consequat velit porta viverra.
            - name: PostgreSQL
              icon: fa6-brands:postgresql
              level: 2
            - name: MongoDB
              icon: fa6-brands:mongodb
              level: 1
            - name: Firebase
              icon: fa6-brands:firebase
              level: 1
            - name: pnpm
              icon: simple-icons:pnpm
              level: 3
        - title: I want to learn
          skills:
            - name: Apollo GraphQL
              icon: fa6-brands:graphql
            - name: Astro
              icon: fa6-brands:astro
            - name: Supabase
              icon: simple-icons:supabase
            - name: Cypress
              icon: fa6-brands:cypress
        - title: I speak
          skills:
            - name: Polish - native
              icon: circle-flags:pl
            - name: English - C1
              icon: circle-flags:us
            - name: Spanish - B1
              icon: circle-flags:es-variant

  # === EXPERIENCE SECTION ===
  - type: experience
    data:
      title: Experience
      slug: experience
      icon: fa6-solid:briefcase
      visible: true
      items:
        - company: CloudBlue
          location: 'Enschede, the Netherlands'
          logo: /logos/cloudblue.svg
          website: https://cloudblue.com
          roles:
            - title: Delivery Manager
              period: Mar 2023 – Apr 2025
              description: Led partner enablement and post-launch support across a cloud-based commerce platform.
              bullets:
                - Led partner enablement and post-launch support across a cloud-based commerce platform.
                - Managed delivery of integration projects, advised on product configuration and SaaS monetization strategies.
                - Coordinated cross-functional teams to drive scalable solution adoption and improve partner experience.
                - Contributed to platform transformation initiatives, including migration, new microservices adoption and e-Commerce platform development.
              technologies:
                - React
                - TypeScript
                - Node.js
                - AWS
              links:
                - label: Company Website
                  url: https://cloudblue.com
                - label: Product Demo
                  url: https://demo.cloudblue.com
        - company: Datacom
          location: 'Kuala Lumpur, Malaysia'
          logo: /logos/datacom.svg
          website: https://datacom.com
          roles:
            - title: Business Consultant
              period: Jun 2019 – Mar 2023
              description: Provided strategic and operational support across managed services operations.
              bullets:
                - Provided strategic and operational support across managed services operations, acting as a subject matter expert on platform processes and best practices.
                - Led internal knowledge transfer and enablement initiatives, supporting global teams in adopting productized workflows and ITIL-based operations (Problem & Change Management).
                - Drove process improvements with key partners to improve incident handling, reduce backlog, and strengthen SLA adherence.
                - Played a central role in platform enablement, bridging product knowledge and day-to-day operational excellence.
              technologies:
                - ITIL
                - ServiceNow
                - Process Management
              links:
                - label: Company Website
                  url: https://datacom.com
            - title: Lead Technical Account Manager
              period: Jun 2019 – Mar 2023
              description: Acted as strategic liaison between enterprise clients and internal teams.
              bullets:
                - Acted as strategic liaison between enterprise clients and internal teams, supporting cloud platform optimization, managed services delivery, and partner success initiatives.
                - Led technical account operations, coordinated escalations, and enabled cross-functional collaboration across support, product, and delivery teams.
                - Drove process improvements, change management, and contract optimization across multiple regions.
                - Advised clients on platform usage, roadmaps, and upgrade planning; conducted stakeholder reviews and supported product adoption.
                - Contributed to retention and recovery of at-risk accounts through on-site consulting and tailored solution design.
              technologies:
                - Cloud Platforms
                - Account Management
                - Technical Consulting
              links:
                - label: Case Study
                  url: https://datacom.com/case-study
        - company: CloudBlue
          location: 'Novosibirsk, Russia'
          logo: /logos/cloudblue.svg
          website: https://cloudblue.com
          roles:
            - title: Technical Account Manager
              period: Jun 2018 – Jun 2019
              description: Supported telecom and hosting providers in operating and scaling cloud business.
              bullets:
                - Supported telecom and hosting providers in operating and scaling cloud business through XaaS platform solutions.
                - Coordinated upgrade and migration projects, provided technical account oversight, and facilitated incident resolution with cross-regional support.
                - Improved internal workflows, knowledge management, and customer success initiatives.
                - Assisted revenue recovery/remediation by re-engaging dormant enterprise clients via technical enablement and platform upgrades.
              technologies:
                - XaaS Platforms
                - Cloud Migration
                - Technical Support
              links:
                - label: Platform Documentation
                  url: https://docs.cloudblue.com
        - company: Implementation Engineer — Banking Projects
          location: 'Novosibirsk, Russia'
          logo: /logos/banking.svg
          website: https://banking-solutions.com
          roles:
            - title: Implementation Engineer
              period: Sep 2016 – Jun 2018
              description: Delivered end-to-end implementation of core banking systems and satellite modules.
              bullets:
                - Delivered end-to-end implementation of core banking systems and satellite modules: deployment, configuration, SIT/UAT coordination, and post-launch support.
                - Translated business requirements into technical specifications in collaboration with front office, IT, and compliance stakeholders.
                - Prepared SRS and localized technical materials; contributed to international rollout across Southeast Asia.
                - Acted as QA lead during acceptance and mentored junior engineers within the implementation team.
              technologies:
                - Core Banking Systems
                - Java
                - Oracle
                - QA Testing
              links:
                - label: Banking Solutions
                  url: https://banking-solutions.com

  # === FAVORITES SECTION ===
  - type: favorites
    data:
      title: Favorites
      slug: favorites
      icon: fa6-solid:star
      visible: true
      style:
        variant: tile
        cols:
          base: 2
          sm: 3
          lg: 6
      groups:
        - title: Books I read
          type: books
          style:
            limit: 5
          items:
            - title: The Pragmatic Programmer: From Journeyman to Master
              author: Andy Hunt, Dave Thomas
              url: https://www.goodreads.com/book/show/4099.The_Pragmatic_Programmer
              image: /devscard/favorites/books/book-1.jpeg
            - title: Domain-Driven Design: Tackling Complexity in the Heart of Software
              author: Eric Evans
              url: https://www.goodreads.com/book/show/179133.Domain_Driven_Design
              image: /devscard/favorites/books/book-2.jpg
            - title: Clean Code: A Handbook of Agile Software Craftsmanship
              author: Robert C. Martin
              url: https://www.goodreads.com/book/show/3735293-clean-code
              image: /devscard/favorites/books/book-3.jpeg
            - title: The Clean Coder: A Code of Conduct for Professional Programmers
              author: Robert C. Martin
              url: https://www.goodreads.com/book/show/10284614-the-clean-coder
              image: /devscard/favorites/books/book-4.jpeg
        - title: People I learn from
          type: people
          style:
            limit: 5
          items:
            - name: Kent C. Dodds
              url: https://kentcdodds.com/
              image: /devscard/favorites/people/person-1.jpg
            - name: Kent Beck
              url: https://www.kentbeck.com/
              image: /devscard/favorites/people/person-2.jpeg
            - name: Eric Evans
              url: https://www.domainlanguage.com/
              image: /devscard/favorites/people/person-3.jpeg
            - name: Martin Fowler
              url: https://martinfowler.com/
              image: /devscard/favorites/people/person-4.jpeg
            - name: Robert C. Martin
              url: http://cleancoder.com/
              image: /devscard/favorites/people/person-5.jpg
            - name: Adam Dymitruk
              url: https://eventmodeling.org/
              image: /devscard/favorites/people/person-6.jpeg
        - title: Videos I watched
          type: videos
          style:
            limit: 5
          items:
            - title: Building Resilient Frontend Architecture • Monica Lent • GOTO 2019
              url: https://youtu.be/TqfbAXCCVwE
              image: /devscard/favorites/videos/video-1.jpeg
            - title: Scaling Yourself • Scott Hanselman • GOTO 2012
              url: https://youtu.be/FS1mnISoG7U
              image: /devscard/favorites/videos/video-2.jpeg
            - title: Clean Architecture • Uncle Bob • GOTO 2012
              url: https://youtu.be/QyJZzq0v7Z4
              image: /devscard/favorites/videos/video-3.jpeg
        - title: Media I follow
          type: medias
          style:
            limit: 5
          items:
            - title: Fireship.io
              type: YouTube channel
              url: https://www.youtube.com/c/Fireship
              image: /devscard/favorites/media/media-1.jpeg
            - title: Healthy Software Developer
              type: YouTube channel
              url: https://www.youtube.com/channel/UCfe_znKY1ukrqlGActlFmaQ
              image: /devscard/favorites/media/media-2.jpeg
            - title: Bytes
              type: Newsletter
              url: https://bytes.dev/
              image: /devscard/favorites/media/media-3.png
            - title: TypeScript Weekly
              type: Newsletter
              url: https://typescript-weekly.com/
              image: /devscard/favorites/media/media-4.png
            - title: Front End Happy Hour
              type: Podcast
              url: https://www.frontendhappyhour.com/
              image: /devscard/favorites/media/media-5.jpeg
            - title: .cult by Honeypot
              type: Blog
              url: https://cult.honeypot.io/
              image: /devscard/favorites/media/media-6.webp
        - title: Hobbies
          type: hobbies
          style:
            limit: 5
          items:
            - title: Technologies
            - title: Snowboarding
            - title: Art
            - title: Stand-up Comedy
            - title: Cooking
        - title: People I Follow
          type: people
          style:
            limit: 5
          items:
            - title: Joe Rogan
            - title: Seth Rogen
            - title: Mark Manson
            - title: Travis Rice
            - title: Andrew Huberman
        - title: Media I Follow
          type: medias
          style:
            limit: 5
          items:
            - title: BBC
            - title: Y Combinator
            - title: Red Bull Media House
            - title: Artsy
            - title: Inked Magazine
        - title: Books
          type: books
          style:
            limit: 5
          items:
            - title: How to Create Tech Products Customers Love
            - title: Shantaram
            - title: The Subtle Art of Not Giving a Fuck
            - title: Idiot
            - title: Crime and Punishment
        - title: Movies
          type: movies
          style:
            limit: 5
          items:
            - title: Pulp Fiction
            - title: Spirited Away
            - title: The Big Lebowski
            - title: Snatch
            - title: Fight Club
---


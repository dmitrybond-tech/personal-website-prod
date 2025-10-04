---
title: Обо мне
slug: ru/about
sections:
  # === MAIN SECTION ===
  - type: main
    data:
      title: Профиль
      slug: profile
      icon: fa6-solid:user
      visible: true
      fullName: Марк Фриман
      role: Senior React Developer
      image: /devscard/my-image.jpeg
      description: |
        Lorem ipsum dolor sit amet, consectetur **adipiscing elit**. In sodales ac dui at *vestibulum*. In condimentum metus id dui tincidunt, in blandit mi [vehicula](/). Nulla lacinia, erat sit amet elementum vulputate, lectus mauris volutpat mi, vitae accumsan metus elit ut nunc. Vestibulum lacinia enim eget eros fermentum scelerisque. Proin augue leo, posuere ut imperdiet vitae, fermentum eu ipsum. Sed sed neque sagittis, posuere urna nec, commodo leo. Pellentesque posuere justo vitae massa volutpat maximus.
      details:
        - label: Телефон
          value: 605 475 6961
          url: tel:605 475 6961
        - label: Email
          value: mark.freeman.dev@gmail.com
          url: mailto:mark.freeman.dev@gmail.com
        - label: Откуда
          value: Варшава, Польша
        - label: Зарплата
          value: 18 000 - 25 000 PLN
      tags:
        - name: Открыт для фриланса
        - name: Доступен для менторства
        - name: Работаю над сайд-проектом
      action:
        label: Скачать CV
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
      title: Навыки
      slug: skills
      icon: fa6-solid:bars-progress
      visible: true
      skillSets:
        - title: Уже знаю
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
        - title: Хочу изучить
          skills:
            - name: Apollo GraphQL
              icon: fa6-brands:graphql
            - name: Astro
              icon: fa6-brands:astro
            - name: Supabase
              icon: simple-icons:supabase
            - name: Cypress
              icon: fa6-brands:cypress
        - title: Языки
          skills:
            - name: Польский - родной
              icon: circle-flags:pl
            - name: Английский - C1
              icon: circle-flags:us
            - name: Испанский - B1
              icon: circle-flags:es-variant

  # === EXPERIENCE SECTION ===
  - type: experience
    data:
      title: Опыт
      slug: experience
      icon: fa6-solid:briefcase
      visible: true
      items:
        - company: CloudBlue
          location: 'Энсхеде, Нидерланды'
          logo: /logos/cloudblue.svg
          website: https://cloudblue.com
          roles:
            - title: Delivery Manager
              period: мар 2023 – апр 2025
              description: Руководил enablement-инициативами партнёров и поддержкой после запуска на облачной коммерческой платформе.
              bullets:
                - Руководил enablement-инициативами партнёров и поддержкой после запуска на облачной коммерческой платформе.
                - Управлял доставкой интеграционных проектов, консультировал по конфигурации продукта и стратегиям монетизации SaaS.
                - Координировал межфункциональные команды для масштабирования решений и улучшения опыта партнёров.
                - Участвовал в инициативах трансформации платформы, включая миграцию, внедрение новых микросервисов и разработку e-Commerce платформы.
              technologies:
                - React
                - TypeScript
                - Node.js
                - AWS
              links:
                - label: Сайт компании
                  url: https://cloudblue.com
                - label: Демо продукта
                  url: https://demo.cloudblue.com
        - company: Datacom
          location: 'Куала-Лумпур, Малайзия'
          logo: /logos/datacom.svg
          website: https://datacom.com
          roles:
            - title: Бизнес-консультант
              period: июн 2019 – мар 2023
              description: Оказывал стратегическую и операционную поддержку в управляемых сервисах.
              bullets:
                - Оказывал стратегическую и операционную поддержку в управляемых сервисах, выступая экспертом по процессам платформы и лучшим практикам.
                - Руководил инициативами передачи знаний и обучения, поддерживая глобальные команды в принятии стандартизированных рабочих процессов и ITIL-операций.
                - Двигал улучшения процессов с ключевыми партнёрами для улучшения обработки инцидентов, сокращения бэклога и укрепления соблюдения SLA.
                - Играл центральную роль в enablement платформы, соединяя знания продукта с операционным совершенством.
              technologies:
                - ITIL
                - ServiceNow
                - Управление процессами
              links:
                - label: Сайт компании
                  url: https://datacom.com
            - title: Ведущий технический менеджер аккаунтов
              period: июн 2019 – мар 2023
              description: Выступал стратегическим связующим звеном между корпоративными клиентами и внутренними командами.
              bullets:
                - Выступал стратегическим связующим звеном между корпоративными клиентами и внутренними командами, поддерживая оптимизацию облачной платформы, доставку управляемых сервисов и инициативы успеха партнёров.
                - Руководил техническими операциями аккаунтов, координировал эскалации и обеспечивал межфункциональное сотрудничество между командами поддержки, продукта и доставки.
                - Двигал улучшения процессов, управление изменениями и оптимизацию контрактов в нескольких регионах.
                - Консультировал клиентов по использованию платформы, дорожным картам и планированию обновлений; проводил обзоры заинтересованных сторон и поддерживал внедрение продукта.
                - Участвовал в удержании и восстановлении проблемных аккаунтов через консалтинг на месте и индивидуальный дизайн решений.
              technologies:
                - Облачные платформы
                - Управление аккаунтами
                - Техническое консультирование
              links:
                - label: Кейс-стади
                  url: https://datacom.com/case-study

  # === FAVORITES SECTION ===
  - type: favorites
    data:
      title: Избранное
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
        - title: Книги, которые читаю
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
        - title: Люди, у которых учусь
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
        - title: Хобби
          type: hobbies
          style:
            limit: 5
          items:
            - title: Технологии
            - title: Сноубординг
            - title: Искусство
            - title: Стендап
            - title: Кулинария
        - title: Люди, за которыми слежу
          type: people
          style:
            limit: 5
          items:
            - title: Joe Rogan
            - title: Seth Rogen
            - title: Mark Manson
            - title: Travis Rice
            - title: Andrew Huberman
        - title: Медиа, за которыми слежу
          type: medias
          style:
            limit: 5
          items:
            - title: BBC
            - title: Y Combinator
            - title: Red Bull Media House
            - title: Artsy
            - title: Inked Magazine
        - title: Книги
          type: books
          style:
            limit: 5
          items:
            - title: How to Create Tech Products Customers Love
            - title: Shantaram
            - title: The Subtle Art of Not Giving a Fuck
            - title: Идиот
            - title: Преступление и наказание
        - title: Фильмы
          type: movies
          style:
            limit: 5
          items:
            - title: Pulp Fiction
            - title: Унесённые призраками
            - title: The Big Lebowski
            - title: Snatch
            - title: Fight Club
---


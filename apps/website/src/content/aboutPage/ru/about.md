---
title: Обо мне
slug: ru/about
cv_pdf: https://example.com/cv.pdf
sections:
  - type: hero
    data:
      name: Иван Иванов
      role: Full-Stack Разработчик
      avatar: https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face
      avatarSizePx: 160
      location: Москва, Россия
      bio: Увлеченный разработчик с 5+ годами опыта создания масштабируемых веб-приложений. Люблю работать с современными технологиями и создавать удобные интерфейсы.
      links:
        - label: GitHub
          url: https://github.com/ivanivanov
          icon: simple-icons:github
        - label: LinkedIn
          url: https://linkedin.com/in/ivanivanov
          icon: simple-icons:linkedin
        - label: Портфолио
          url: https://ivanivanov.dev
          icon: simple-icons:portfolio
      badges:
        - name: React Эксперт
        - name: TypeScript Профи
  - type: skills
    data:
      title: Навыки
      groups:
        - title: General
          items:
            - name: React.js
              icon: logos:react
              level: 4
            - name: TypeScript
              icon: logos:typescript-icon
              level: 4
            - name: SASS
              icon: logos:sass
              level: 3
        - title: Frameworks
          items:
            - name: NestJS
              icon: logos:nestjs
              level: 3
            - name: Tailwind CSS
              icon: logos:tailwindcss-icon
              level: 4
            - name: Astro
              icon: logos:astro-icon
              level: 3
            - name: Next.js
              icon: logos:nextjs-icon
              level: 3
            - name: Cypress
              icon: logos:cypress
              level: 3
            - name: ESLint
              icon: logos:eslint
              level: 4
        - title: Technical
          items:
            - name: PostgreSQL
              icon: logos:postgresql
              level: 3
            - name: MongoDB
              icon: logos:mongodb-icon
              level: 3
            - name: Firebase
              icon: logos:firebase
              level: 3
            - name: GraphQL
              icon: logos:graphql
              level: 3
            - name: pnpm
              icon: logos:pnpm
              level: 3
            - name: Supabase
              icon: logos:supabase-icon
              level: 3
        - title: Languages
          items:
            - name: English - C1
              icon: twemoji:flag-united-kingdom
            - name: Polish - native
              icon: twemoji:flag-poland
            - name: Spanish - B1
              icon: twemoji:flag-spain
  - type: experience
    data:
      title: Опыт работы
      items:
        - company: ТехКорп Инк.
          role: Старший Full-Stack Разработчик
          dates: ["2022-01-01", "2024-12-31"]
          location: Москва, Россия
          description: Руководил разработкой масштабируемых веб-приложений с использованием React, Node.js и PostgreSQL. Наставлял младших разработчиков и внедрял CI/CD пайплайны.
          image: https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop
          stack: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"]
          bullets:
            - "Улучшил производительность приложения на 40% через оптимизацию кода"
            - "Руководил командой из 5 разработчиков на нескольких проектах"
            - "Внедрил автоматизированное тестирование, сократив количество багов на 60%"
          links:
            - label: Сайт компании
              url: https://techcorp.ru
              icon: simple-icons:web
        - company: СтартапXYZ
          role: Frontend Разработчик
          dates: ["2020-06-01", "2021-12-31"]
          location: Удаленно
          description: Создавал адаптивные пользовательские интерфейсы и сотрудничал с командой дизайнеров для создания увлекательного пользовательского опыта.
          stack: ["React", "Vue.js", "SASS", "Webpack"]
          bullets:
            - "Разработал 15+ переиспользуемых UI компонентов"
            - "Сократил размер бандла на 30% через разделение кода"
  - type: education
    data:
      title: Образование
      items:
        - institution: Московский Государственный Университет
          degree: Бакалавр компьютерных наук
          field: Программная инженерия
          dates: ["2016-09-01", "2020-05-31"]
          location: Москва, Россия
          description: Сосредоточился на программной инженерии, алгоритмах и структурах данных. Участвовал в множественных хакатонах и соревнованиях по программированию.
          gpa: "4.8/5.0"
          achievements:
            - "Список декана в течение 6 семестров подряд"
            - "1 место в университетском хакатоне 2019"
            - "Президент клуба компьютерных наук"
        - institution: Академия Кода
          degree: Сертификат Full-Stack веб-разработки
          dates: ["2020-01-01", "2020-06-30"]
          description: Интенсивный буткемп, охватывающий современные технологии веб-разработки и лучшие практики.
  - type: favorites
    data:
      title: Избранное
      style:
        variant: tile
        cols: { base: 2, sm: 3, lg: 6 }
      groups:
        - title: Хобби
          style: { limit: 5 }
          items:
            - { title: "Фотография", image: "/fav/hobbies/photo.jpg", url: "https://unsplash.com/@johndoe" }
            - { title: "Велоспорт", image: "/fav/hobbies/cycle.jpg" }
            - { title: "Кулинария", image: "/fav/hobbies/cook.jpg" }
            - { title: "Шахматы", image: "/fav/hobbies/chess.jpg" }
            - { title: "Путешествия", image: "/fav/hobbies/travel.jpg" }
            - { title: "Музыка", image: "/fav/hobbies/music.jpg" }
        - title: Люди, за которыми слежу
          style: { limit: 5 }
          items:
            - { title: "Дан Абрамов", image: "/fav/people/dan.jpg", url: "https://twitter.com/dan_abramov" }
            - { title: "Тео Браун", image: "/fav/people/theo.jpg", url: "https://youtube.com/@t3dotgg" }
        - title: Медиа, которое смотрю
          style: { limit: 5 }
          items:
            - { title: "Fireship", author: "YouTube", image: "/fav/media/fireship.jpg", url: "https://youtube.com/@Fireship" }
            - { title: "ThePrimeTime", author: "Twitch",  image: "/fav/media/primetime.jpg", url: "https://twitch.tv/theprimeagen" }
        - title: Книги
          style: { limit: 5 }
          items:
            - { title: "Чистый код", author: "Роберт Мартин", image: "/fav/books/cleancode.jpg", url: "https://..." }
            - { title: "Прагматичный программист", author: "Хант/Томас", image: "/fav/books/pragprog.jpg", url: "https://..." }
        - title: Фильмы
          style: { limit: 5 }
          items:
            - { title: "Матрица", author: "Вачовски", image: "/fav/movies/matrix.jpg" }
            - { title: "Начало", author: "Кристофер Нолан", image: "/fav/movies/inception.jpg" }
---

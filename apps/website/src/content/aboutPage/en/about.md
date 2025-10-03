---
title: About
slug: en/about
cv_pdf: https://example.com/cv.pdf
sections:
  - type: hero
    data:
      name: John Doe
      role: Full-Stack Developer
      avatar: https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face
      avatarSizePx: 160
      location: San Francisco, CA
      bio: Passionate developer with 5+ years of experience building scalable web applications. I love working with modern technologies and creating user-friendly interfaces.
      links:
        - label: GitHub
          url: https://github.com/johndoe
          icon: simple-icons:github
        - label: LinkedIn
          url: https://linkedin.com/in/johndoe
          icon: simple-icons:linkedin
        - label: Portfolio
          url: https://johndoe.dev
          icon: simple-icons:portfolio
      badges:
        - name: React Expert
        - name: TypeScript Pro
  - type: skills
    data:
      title: Skills
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
      title: Experience
      items:
        - company: TechCorp Inc.
          role: Senior Full-Stack Developer
          dates: ["2022-01-01", "2024-12-31"]
          location: San Francisco, CA
          description: Led development of scalable web applications using React, Node.js, and PostgreSQL. Mentored junior developers and implemented CI/CD pipelines.
          image: https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop
          stack: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"]
          bullets:
            - "Improved application performance by 40% through code optimization"
            - "Led a team of 5 developers on multiple projects"
            - "Implemented automated testing reducing bugs by 60%"
          links:
            - label: Company Website
              url: https://techcorp.com
              icon: simple-icons:web
        - company: StartupXYZ
          role: Frontend Developer
          dates: ["2020-06-01", "2021-12-31"]
          location: Remote
          description: Built responsive user interfaces and collaborated with design team to create engaging user experiences.
          stack: ["React", "Vue.js", "SASS", "Webpack"]
          bullets:
            - "Developed 15+ reusable UI components"
            - "Reduced bundle size by 30% through code splitting"
  - type: education
    data:
      title: Education
      items:
        - institution: University of California
          degree: Bachelor of Science in Computer Science
          field: Software Engineering
          dates: ["2016-09-01", "2020-05-31"]
          location: Berkeley, CA
          description: Focused on software engineering, algorithms, and data structures. Participated in multiple hackathons and coding competitions.
          gpa: "3.8/4.0"
          achievements:
            - "Dean's List for 6 consecutive semesters"
            - "1st place in University Hackathon 2019"
            - "President of Computer Science Club"
        - institution: Code Academy
          degree: Full-Stack Web Development Certificate
          dates: ["2020-01-01", "2020-06-30"]
          description: Intensive bootcamp covering modern web development technologies and best practices.
  - type: favorites
    data:
      title: Favorites
      style:
        variant: tile
        cols: { base: 2, sm: 3, lg: 6 }
      groups:
        - title: Hobbies
          style: { limit: 5 }
          items:
            - { title: "Photography", image: "/fav/hobbies/photo.jpg", url: "https://unsplash.com/@johndoe" }
            - { title: "Cycling", image: "/fav/hobbies/cycle.jpg" }
            - { title: "Cooking", image: "/fav/hobbies/cook.jpg" }
            - { title: "Chess", image: "/fav/hobbies/chess.jpg" }
            - { title: "Travel", image: "/fav/hobbies/travel.jpg" }
            - { title: "Music", image: "/fav/hobbies/music.jpg" }
        - title: Persons I Follow
          style: { limit: 5 }
          items:
            - { title: "Dan Abramov", image: "/fav/people/dan.jpg", url: "https://twitter.com/dan_abramov" }
            - { title: "Theo Browne", image: "/fav/people/theo.jpg", url: "https://youtube.com/@t3dotgg" }
        - title: Media I Follow
          style: { limit: 5 }
          items:
            - { title: "Fireship", author: "YouTube", image: "/fav/media/fireship.jpg", url: "https://youtube.com/@Fireship" }
            - { title: "ThePrimeTime", author: "Twitch",  image: "/fav/media/primetime.jpg", url: "https://twitch.tv/theprimeagen" }
        - title: Books
          style: { limit: 5 }
          items:
            - { title: "Clean Code", author: "Robert C. Martin", image: "/fav/books/cleancode.jpg", url: "https://..." }
            - { title: "Pragmatic Programmer", author: "Hunt/Thomas", image: "/fav/books/pragprog.jpg", url: "https://..." }
        - title: Movies
          style: { limit: 5 }
          items:
            - { title: "The Matrix", author: "The Wachowskis", image: "/fav/movies/matrix.jpg" }
            - { title: "Inception", author: "Christopher Nolan", image: "/fav/movies/inception.jpg" }
---

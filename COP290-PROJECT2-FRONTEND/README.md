## TASK BOARD

Jira Like Task Management application built with Vite,React and CSS for frontend, and Typescript(Express),Prisma and PostgreSQL for backend.

### SETUP

```
npm install
npm run dev

#OR CLEAN REINSTALL:
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run dev
```

### PROJECT STRUCTURE

```
.
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── public
│   └── vite.svg
├── README.md
├── src
│   ├── App.tsx
│   ├── assets
│   │   ├── background.png
│   │   ├── dashboard.svg
│   │   ├── fahh.mp3
│   │   ├── logout.svg
│   │   ├── menu.svg
│   │   ├── moon.svg
│   │   ├── notifications.svg
│   │   ├── projects.svg
│   │   └── sun.svg
│   ├── components
│   │   ├── layout
│   │   │   ├── Layout.module.css
│   │   │   ├── Layout.tsx
│   │   │   └── Layout.types.tsx
│   │   ├── popup
│   │   │   ├── popup.module.css
│   │   │   ├── popup.tsx
│   │   │   └── popup.types.tsx
│   │   └── workflow
│   │       ├── workflow.manager.tsx
│   │       ├── workflow.module.css
│   │       ├── workflow.tsx
│   │       └── workflow.types.tsx
│   ├── context
│   │   ├── auth.tsx
│   │   └── auth.types.tsx
│   ├── index.css
│   ├── lib
│   │   ├── api.ts
│   │   └── commentRichText.tsx
│   ├── main.tsx
│   └── pages
│       ├── dashboard
│       │   ├── dashboard.module.css
│       │   ├── dashboard.tsx
│       │   └── dashboard.types.tsx
│       ├── kanbanboard
│       │   ├── kanbanboard.modals.tsx
│       │   ├── kanbanboard.module.css
│       │   ├── kanbanboard.tsx
│       │   └── kanbanboard.types.tsx
│       ├── login
│       │   ├── login.module.css
│       │   └── login.tsx
│       ├── notifications
│       │   ├── notifications.module.css
│       │   ├── notifications.tsx
│       │   ├── notifications.types.ts
│       │   └── notifications.utils.ts
│       ├── profile
│       │   ├── profile.module.css
│       │   └── profile.tsx
│       ├── project
│       │   ├── project.module.css
│       │   ├── project.tsx
│       │   └── project.types.tsx
│       ├── register
│       │   ├── register.module.css
│       │   └── register.tsx
│       └── task
│           ├── task.module.css
│           └── task.tsx
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts

19 directories, 58 files
```

### Tech stack:

- React
- TypeScript
- Vite
- CSS

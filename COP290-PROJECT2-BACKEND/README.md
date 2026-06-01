## TAKSBOARD-BACKEND

Jira Like Task Management application built with Vite,React and CSS for frontend, and Typescript(Express),Prisma and PostgreSQL for backend.

### SETUP:

1. Create a `.env` file in the root directory with the following content:

```env
DATABASE_URL="postgresql://postgres:password@localhost:1729/taskboard"
PASSKEY="abhinavpj"
NODE_ENV=development
PORT=3001
```

2. Run the following commands:

```bash
docker run -d \
 --name taskboard-db \
  -p 1729:5432 \
   -e POSTGRES_PASSWORD=password \
    -e POSTGRES_DB=taskboard \
    postgres

#if you face npm issues
npm cache clean --force
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
#run unit tests:
npx vitest
```

### PROJECT STRUCTURE:

```
.
├── package-lock.json
├── package.json
├── prisma
│   └── schema.prisma
├── prisma.config.ts
├── README.md
├── src
│   ├── app.ts
│   ├── core
│   │   ├── config
│   │   │   └── constants.ts
│   │   ├── database
│   │   │   └── db.ts
│   │   └── middleware
│   │       ├── auth.ts
│   │       ├── errorhandler.ts
│   │       └── utils.ts
│   ├── modules
│   │   ├── auth
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.service.ts
│   │   ├── boards
│   │   │   ├── boards.controller.ts
│   │   │   ├── boards.routes.ts
│   │   │   └── boards.service.ts
│   │   ├── columns
│   │   │   ├── columns.controller.ts
│   │   │   ├── columns.routes.ts
│   │   │   ├── columns.service.ts
│   │   │   └── columns.utils.ts
│   │   ├── comments
│   │   │   ├── comments.controller.ts
│   │   │   ├── comments.routes.ts
│   │   │   └── comments.service.ts
│   │   ├── dashboard
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   └── dashboard.service.ts
│   │   ├── health
│   │   │   ├── health.controller.ts
│   │   │   ├── health.routes.ts
│   │   │   └── health.service.ts
│   │   ├── issues
│   │   │   ├── issues.controller.ts
│   │   │   ├── issues.move.ts
│   │   │   ├── issues.patch.ts
│   │   │   ├── issues.routes.ts
│   │   │   ├── issues.service.ts
│   │   │   └── issues.utils.ts
│   │   ├── notifications
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.routes.ts
│   │   │   └── notifications.service.ts
│   │   ├── projects
│   │   │   ├── members.service.ts
│   │   │   ├── projects.controller.ts
│   │   │   ├── projects.routes.ts
│   │   │   └── projects.service.ts
│   │   └── user
│   │       ├── user.controller.ts
│   │       ├── user.routes.ts
│   │       └── user.service.ts
│   ├── server.ts
│   ├── tests
│   │   ├── 01-auth_start.test.ts
│   │   ├── 02-projects.test.ts
│   │   ├── 03-dashboard.test.ts
│   │   ├── 04-notifications.test.ts
│   │   ├── 05-board.test.ts
│   │   ├── 06-column.test.ts
│   │   ├── 07-issue.test.ts
│   │   ├── 08-comment.test.ts
│   │   ├── 09-auth_end.test.ts
│   │   ├── all.test.ts
│   │   ├── setup.ts
│   │   └── state.ts
│   └── types
│       └── authRequest.ts
├── tsconfig.json
└── vitest.config.ts

20 directories, 62 files
```

### UNIT TESTS(written with Vitest):

```bash

 ✓ src/tests/all.test.ts (35 tests) 421ms
   ✓ User registration (1)
     ✓ should register a new user 88ms
   ✓ User login (1)
     ✓ should login an existing user 66ms
   ✓ Get current user (1)
     ✓ should get the current logged in user 4ms
   ✓ Refresh token (1)
     ✓ should refresh the access token 3ms
   ✓ update user profile (1)
     ✓ should update the profile of the current user 5ms
   ✓ create project (1)
     ✓ should create a new project 16ms
   ✓ List all projects (1)
     ✓ should list all projects of the current user 7ms
   ✓ Get project by id (1)
     ✓ should get a project by id 5ms
   ✓ update project (1)
     ✓ should update a project 7ms
   ✓ archive project (1)
     ✓ should archive a project 5ms
   ✓ get project members (1)
     ✓ should get all members of a project 4ms
   ✓ add project member (1)
     ✓ should add a member to a project 68ms
   ✓ update member role (1)
     ✓ should update a member's role in a project 10ms
   ✓ remove project member (1)
     ✓ should remove a member from a project 7ms
   ✓ dashboard stats (1)
     ✓ should get dashboard stats 7ms
   ✓ recent projects (1)
     ✓ should get recent projects 4ms
   ✓ recent activity (1)
     ✓ should get recent activity 2ms
   ✓ notifications (1)
     ✓ should get notifications for the current user 1ms
   ✓ mark all notifications as read (1)
     ✓ should mark all notifications as read 2ms
   ✓ mark notification as read (1)
     ✓ should mark a notification as read 1ms
   ✓ create board (1)
     ✓ should create a new board 17ms
   ✓ Get board by id (1)
     ✓ should get a board by id 3ms
   ✓ create issue in column (1)
     ✓ should create a new issue in a column 14ms
   ✓ create column (1)
     ✓ should create a new column in a board 5ms
   ✓ update column (1)
     ✓ should update a column in a board 6ms
   ✓ delete column (1)
     ✓ should delete a column in a board 4ms
   ✓ get issue given id (1)
     ✓ Get an issue by id 4ms
   ✓ update issue (1)
     ✓ should update an issue by id 5ms
   ✓ move issue (1)
     ✓ should move an issue to another column 6ms
   ✓ delete issue (1)
     ✓ should delete an issue by id 4ms
   ✓ add comment to issue (1)
     ✓ should add a comment to an issue 7ms
   ✓ update comment of an issue (1)
     ✓ should update a comment of an issue 5ms
   ✓ delete comment of an issue (1)
     ✓ should delete a comment of an issue 5ms
   ✓ Update avatar (1)
     ✓ should update the avatar of the current user 2ms
   ✓ User logout (1)
     ✓ should logout the current user 1ms

 Test Files  1 passed (1)
      Tests  35 passed (35)
   Start at  11:43:54
   Duration  627ms (transform 40ms, setup 35ms, collect 38ms, tests 421ms, environment 0ms, prepare 30ms)
```

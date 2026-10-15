# ScholarFlow Web

Web app for **ScholarFlow**, a learning platform where the AI tutor answers from each course's own notes. It shares the [backend](../backend) with the [mobile app](../mobile) and has the same features for every role.

**Live:** https://scholarflow-app.vercel.app

## Features

**Everyone**

- Home page with a live example of a tutor answer, and a public course catalogue with search and category filters
- Sign up as a learner or instructor, and log in

**Learners**

- Course pages with curriculum, free enrollment and checkout for paid courses
- My learning, and a lesson player with video, notes, PDF and lesson navigation
- AI tutor: answers show what the course notes say, with citations, followed by an explanation. It's available as a full page and as an **Ask AI** panel on course and lesson pages, limited to that course.

**Instructors**

- Dashboard, course creation, and a course manager for adding lessons. Notes and PDFs are indexed for the AI tutor, and the result is reported after saving.
- Students per course, and analytics: revenue, enrollments and value per month, students and value per course

**Admins**

- Overview and analytics: revenue, sign-ups, enrollments, users by role, top courses
- Searchable tables of users, courses and enrollments

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · SWR · lucide-react · self-hosted Bricolage Grotesque and Instrument Sans

## Getting started

Requires Node.js 20+ and a running [ScholarFlow API](../backend).

```bash
npm install
cp .env.example .env.local
npm run dev                  # http://localhost:3001
```

| Variable              | Description                        |
| --------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL` | Backend base URL, ending in `/api` |

To run against a local backend, set `NEXT_PUBLIC_API_URL=http://localhost:3000/api`. The backend must list this app's origin in `CORS_ORIGINS` (`http://localhost:3001` is allowed by default).

| Command                              | Description                     |
| ------------------------------------ | ------------------------------- |
| `npm run dev`                        | Development server on port 3001 |
| `npm run build` · `npm start`        | Production build and server     |
| `npm run lint` · `npm run typecheck` | Code quality                    |
| `npm run format`                     | Prettier                        |

## Project structure

```
src/
  app/
    page.tsx              home
    login/ register/      authentication
    courses/              catalogue and course pages with checkout
    my-learning/ learn/   enrolled courses and lesson player
    tutor/                AI tutor
    teach/                instructor dashboard, courses, students, analytics
    admin/                admin overview, analytics, users, courses, enrollments
  components/             app shell, UI kit, charts, tutor, course cards
  lib/                    API client, auth, types, formatting
```

## Deployment

Deploy to Vercel as a standard Next.js project and set `NEXT_PUBLIC_API_URL`. Add the deployed URL to the backend's `CORS_ORIGINS`.

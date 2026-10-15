# ScholarFlow – AI Powered Learning Management System with RAG

**Full-stack monorepo: Backend API · Web App · Mobile App (iOS & Android)**

ScholarFlow is an AI powered Learning Management System (LMS) with a RAG-based (Retrieval-Augmented Generation) AI tutor that answers from the course material itself, not from generic internet knowledge.

- **Instructors** publish courses with video lessons, written notes and PDFs. Every lesson is automatically chunked, embedded and indexed into a vector database.
- **Learners** browse, enroll and study. When they ask a question, the RAG pipeline retrieves the most relevant passages from their enrolled courses. The tutor first quotes what the instructor's notes say, with numbered citations, and then explains it in plain words.
- **Admins** see the whole platform: users, courses, enrollments and revenue analytics.

A single backend API serves both a web app and an iOS/Android app, so every feature works the same on both.

| Package               | Description                                                                           |
| --------------------- | ------------------------------------------------------------------------------------- |
| [`backend/`](backend) | ScholarFlow – AI Powered LMS (Backend): REST API, RAG pipeline, PostgreSQL + pgvector |
| [`web/`](web)         | ScholarFlow – AI Powered LMS (Web): Next.js web application                           |
| [`mobile/`](mobile)   | ScholarFlow – AI Powered LMS (Mobile): Expo / React Native app for iOS and Android    |

### Highlights

- **RAG AI tutor:** Gemini embeddings, pgvector cosine search and grounded answers with citations
- **Role-based access:** learner, instructor and admin, enforced with JWT on every API route
- **Revenue and analytics dashboards** for instructors and admins
- **Checkout flow:** payment, enrollment and progress are written in one database transaction
- **One backend, two clients:** Next.js web app and Expo mobile app

**Live:** [Web app](https://scholarflow-app.vercel.app) · [API health check](https://scholar-flow-ai-powered-learning-ma.vercel.app/api/health)

![ScholarFlow web home](docs/web-home.jpg)

| AI tutor                                  | Instructor analytics                                       |
| ----------------------------------------- | ---------------------------------------------------------- |
| ![AI tutor answer](docs/web-ai-tutor.jpg) | ![Instructor analytics](docs/web-instructor-analytics.jpg) |

![Mobile app: explore, AI tutor, instructor dashboard, admin overview](docs/mobile.jpg)

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [How the AI tutor works (RAG pipeline)](#how-the-ai-tutor-works-rag-pipeline)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Sample data](#sample-data)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Authentication and roles](#authentication-and-roles)
- [Payments](#payments)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Features

### Everyone

- A home page with a live example of a tutor answer
- A public course catalogue with search and category filters
- Sign up as a learner or an instructor, and log in

### Learners

- Course pages showing the curriculum, instructor, level and price
- Free enrollment, and a checkout for paid courses
- **My learning**, listing enrolled courses with progress
- A lesson player with video, notes, PDF and next/previous lesson navigation
- **AI tutor:**
  - available as a full page (web) or a tab (mobile)
  - also opens as an **Ask AI** panel on web, or a floating button on mobile, from any course or lesson; the panel only searches that course
  - every answer has two parts, **What your notes say** (with `[1]`, `[2]` citations to the exact lesson) and **Explanation**
  - flags any part of an answer that goes beyond the notes

### Instructors

- A dashboard with revenue, enrollments, learners and recent activity
- Course creation with title, description, price, category, level and thumbnail
- A course manager for adding lessons with a video link, notes and a PDF link
  - notes and PDFs are indexed for the AI tutor automatically
  - an indexing report is shown after saving (chunks created, PDF pages read, any warnings)
- Student lists per course, showing progress
- Analytics:
  - revenue and enrollments per month
  - students and revenue per course
  - average learner progress

### Admins

- A platform overview: total users, courses, enrollments and revenue
- Analytics:
  - monthly revenue
  - sign-ups and enrollments
  - users by role
  - top courses
- Searchable tables of all users, courses and enrollments
- Admin accounts can't be created through sign-up

## Architecture

```mermaid
flowchart LR
    W["Web app<br/>Next.js · port 3001"] -->|"HTTPS + JWT"| API
    M["Mobile app<br/>Expo / React Native"] -->|"HTTPS + JWT"| API
    API["Backend API<br/>Next.js route handlers · port 3000"] --> DB[("PostgreSQL<br/>+ pgvector")]
    API -->|"embeddings"| E["Gemini<br/>gemini-embedding-001"]
    API -->|"answers"| G["Gemini<br/>gemini-3.5-flash-lite"]
```

- **Backend:** a REST API built with Next.js route handlers. Prisma talks to PostgreSQL, and the `vector` extension stores lesson embeddings. Every protected route checks the JWT and the user's role.
- **Web:** a Next.js App Router app. Pages fetch data with SWR, and the token is kept in `localStorage`.
- **Mobile:** an Expo app with file-based routing. Each role gets its own navigation, guarded with `Stack.Protected`, and the token is kept in the device's secure storage.

## How the AI tutor works (RAG pipeline)

The tutor uses **Retrieval-Augmented Generation (RAG)**: instead of letting the language model answer from memory, ScholarFlow first retrieves the relevant passages from the instructor's own notes and PDFs, then asks the model to answer only from that context. This keeps answers accurate and course-specific, and every claim can be traced back to its source lesson.

| RAG stage    | Implementation                                                           |
| ------------ | ------------------------------------------------------------------------ |
| Ingestion    | Lesson notes + PDF text extraction (unpdf)                               |
| Chunking     | ~1,000-character chunks, 150-character overlap                           |
| Embedding    | Google Gemini `gemini-embedding-001`, 768 dimensions                     |
| Vector store | PostgreSQL + pgvector (`vector(768)` column)                             |
| Retrieval    | Cosine similarity, top 5, scoped to enrolled courses, keyword fallback   |
| Generation   | Gemini `gemini-3.5-flash-lite` with structured JSON output and citations |

### 1. Indexing (when an instructor adds a lesson)

```mermaid
flowchart LR
    L[Lesson saved] --> T[Notes + PDF text]
    T --> C["Chunks<br/>~1,000 chars, 150 overlap"]
    C --> V["Gemini embeddings<br/>768 dimensions"]
    V --> S[("ContentChunk<br/>vector(768)")]
```

1. The lesson's notes are taken as they are. If the lesson has a PDF link (including Google Drive share links), the PDF is downloaded and its text extracted. Files are limited to 15 MB and must be real PDFs.
2. The text is split into chunks of about 1,000 characters with 150 characters of overlap, breaking on paragraphs and sentences where possible.
3. Each chunk is embedded with `gemini-embedding-001` using the `RETRIEVAL_DOCUMENT` task type, normalised, and stored in pgvector.
4. Indexing problems, such as a private PDF, are reported back as warnings. The lesson is always saved.

### 2. Answering (when a learner asks a question)

```mermaid
flowchart LR
    Q[Question] --> QE["Embed question<br/>RETRIEVAL_QUERY"]
    QE --> R["Cosine search<br/>enrolled courses only"]
    R --> K["Top 5 chunks<br/>score ≥ 0.45"]
    K --> A["Gemini<br/>structured JSON"]
    A --> O["What your notes say<br/>+ Explanation + sources"]
```

1. The search is limited to courses the user can read: enrolled courses for learners, their own courses for instructors and every course for admins. It can be narrowed further to a single course.
2. The question is embedded, and the five closest chunks are found by cosine similarity. Chunks scoring below `RAG_MIN_SCORE` (default `0.45`) are dropped.
3. Gemini receives the question and the numbered chunks, and must return JSON:
   - `fromNotes`: what the material says, with `[n]` citations
   - `explanation`: the teaching answer, built on that context
   - `usedOutsideKnowledge`: true when the explanation goes beyond the notes
   - `citations`: which chunks were used
4. If the notes don't cover the question, the answer says so rather than inventing a quote.
5. If the embedding API is unavailable, retrieval falls back to keyword search so the tutor keeps working.

Example response from `POST /api/ai/ask`:

```jsonc
{
  "fromNotes": "A closure keeps access to the outer function's variables after it returns [1].",
  "explanation": "Think of makeCounter(): it returns a function that still holds the count variable…",
  "usedOutsideKnowledge": false,
  "retrieval": "vector",
  "sources": [
    {
      "n": 1,
      "lessonTitle": "Closures",
      "courseTitle": "JavaScript: The Hard Parts",
      "score": 0.82,
      "cited": true,
      "content": "A closure is a function bundled together with references to its surrounding lexical scope…",
    },
  ],
}
```

## Tech stack

| Layer   | Technologies                                                                                                                                             |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend | Next.js 16 (route handlers), TypeScript, Prisma 6, PostgreSQL (Neon) with pgvector, Zod, JSON Web Tokens, bcrypt, Google Gemini (`@google/genai`), unpdf |
| Web     | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, SWR, lucide-react, self-hosted Bricolage Grotesque and Instrument Sans fonts              |
| Mobile  | Expo SDK 57, React Native, TypeScript, Expo Router, Axios, expo-secure-store, react-native-webview                                                       |
| Tooling | ESLint, Prettier, TypeScript strict mode, Vercel (backend and web), EAS Build (mobile)                                                                   |

## Repository structure

```
scholarflow/
├── backend/                      REST API
│   ├── prisma/                   schema and migrations
│   ├── scripts/                  seed data, RAG reindexing
│   └── src/
│       ├── app/api/              route handlers (auth, student, instructor, admin, ai, health)
│       ├── lib/
│       │   ├── auth.ts           JWT helpers
│       │   ├── http.ts           role checks and error handling
│       │   ├── enroll.ts         enrollment and checkout
│       │   ├── gemini.ts         Gemini client and model settings
│       │   └── rag/              chunking, PDF extraction, embeddings, retrieval, answers
│       └── proxy.ts              CORS
│
├── web/                          Web app
│   └── src/
│       ├── app/                  pages: home, auth, courses, learn, tutor, teach, admin
│       ├── components/           app shell, UI kit, charts, tutor, tables, dialogs
│       └── lib/                  API client, auth, types, formatting
│
├── mobile/                       iOS and Android app
│   ├── assets/                   icon and splash screen
│   └── src/
│       ├── app/                  screens: (auth), (tabs), course, learn, ask, teach, manage, admin
│       ├── components/           UI kit, charts, course cards, video player, Ask AI button
│       ├── context/              authentication
│       ├── hooks/                data loading
│       ├── lib/                  API client, types, config
│       └── screens/              screens shared between roles
│
└── docs/                         screenshots used in this README
```

Each app is a standalone npm package with its own `package.json`, `.env.example` and README. There is no root `package.json`, so install and run each one from its own folder.

## Getting started

### Prerequisites

- **Node.js 20 or newer**
- **A PostgreSQL database with the `vector` extension.** [Neon](https://neon.tech) has it on the free tier.
- **A Google Gemini API key.** It is free from [Google AI Studio](https://aistudio.google.com/apikey).
- **For mobile:** the [Expo Go](https://expo.dev/go) app on your phone, or an Android emulator / iOS simulator.

### 1. Clone

```bash
git clone https://github.com/xKakshil/ScholarFlow-AI-Powered-Learning-Management-System-with-RAG.git
cd ScholarFlow-AI-Powered-Learning-Management-System-with-RAG
```

### 2. Backend (start this first)

```bash
cd backend
npm install
cp .env.example .env          # fill in DATABASE_URL, JWT_SECRET and GEMINI_API_KEY
npx prisma migrate deploy     # creates the tables and enables pgvector
npm run db:seed               # optional: sample users, courses and activity
npm run dev                   # http://localhost:3000
```

Check that it's running by opening http://localhost:3000/api/health. It should return `{"status":"ok","database":"ok"}` once the database is reachable.

To generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### 3. Web app

In a second terminal:

```bash
cd web
npm install
cp .env.example .env.local
```

Set `NEXT_PUBLIC_API_URL=http://localhost:3000/api` in `.env.local`, then run:

```bash
npm run dev                   # http://localhost:3001
```

The backend already allows `http://localhost:3001` through CORS.

### 4. Mobile app

In a third terminal:

```bash
cd mobile
npm install
cp .env.example .env
```

In `.env`, set `EXPO_PUBLIC_API_URL` to your computer's local network address, for example `http://192.168.1.10:3000/api`. Your phone can't reach `localhost` on your computer.

- **Windows:** find the address with `ipconfig`.
- **macOS / Linux:** use `ipconfig getifaddr en0` or `hostname -I`.

Then start the app:

```bash
npx expo start --clear
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS). Your phone and computer must be on the same Wi-Fi network.

## Environment variables

### Backend: `backend/.env`

| Variable                 | Required | Default                 | Description                                                                                       |
| ------------------------ | -------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | yes      | none                    | PostgreSQL connection string, e.g. `postgresql://user:pass@host/db?sslmode=require`               |
| `JWT_SECRET`             | yes      | none                    | Long random string used to sign login tokens                                                      |
| `GEMINI_API_KEY`         | yes      | none                    | Google AI Studio key, used for embeddings and answers                                             |
| `CORS_ORIGINS`           | yes\*    | `http://localhost:3001` | Comma-separated browser origins allowed to call the API. \*Required once the web app is deployed. |
| `PAYMENT_MODE`           | no       | `demo`                  | `demo` records paid enrollments without charging; anything else rejects them with `402`           |
| `GEMINI_MODEL`           | no       | `gemini-3.5-flash-lite` | Model used to write tutor answers                                                                 |
| `GEMINI_EMBEDDING_MODEL` | no       | `gemini-embedding-001`  | Model used for embeddings                                                                         |
| `RAG_MIN_SCORE`          | no       | `0.45`                  | Minimum cosine similarity for a chunk to be used as context                                       |

### Web: `web/.env.local`

| Variable              | Required | Description                                                         |
| --------------------- | -------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | yes      | Backend base URL ending in `/api`, e.g. `http://localhost:3000/api` |

### Mobile: `mobile/.env`

| Variable              | Required | Description                                                              |
| --------------------- | -------- | ------------------------------------------------------------------------ |
| `EXPO_PUBLIC_API_URL` | yes      | Backend base URL ending in `/api`; use your LAN IP for local development |
| `EXPO_PUBLIC_WEB_URL` | no       | Web app URL, linked from the admin profile                               |

Expo inlines `EXPO_PUBLIC_*` values when it bundles the app. After changing `.env`, restart with `npx expo start --clear`.

`.env` files are git-ignored. Only the `.env.example` templates are committed.

## Scripts

Run each script from its app's folder.

### Backend

| Command                           | Description                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `npm run dev`                     | Development server on port 3000                                                    |
| `npm run build`                   | Generate the Prisma client and build for production                                |
| `npm start`                       | Run the production build                                                           |
| `npm run db:seed`                 | Load sample data and index it for the tutor (`-- --no-index` skips the embeddings) |
| `npm run rag:reindex`             | Rebuild embeddings for every lesson (`-- <courseId>` for one course)               |
| `npx prisma migrate deploy`       | Apply database migrations                                                          |
| `npx prisma studio`               | Browse the database in the browser                                                 |
| `npm run lint` / `typecheck`      | ESLint / TypeScript                                                                |
| `npm run format` / `format:check` | Prettier                                                                           |

### Web

| Command                           | Description                     |
| --------------------------------- | ------------------------------- |
| `npm run dev`                     | Development server on port 3001 |
| `npm run build` / `npm start`     | Production build and server     |
| `npm run lint` / `typecheck`      | ESLint / TypeScript             |
| `npm run format` / `format:check` | Prettier                        |

### Mobile

| Command                           | Description                                |
| --------------------------------- | ------------------------------------------ |
| `npm start`                       | Expo dev server                            |
| `npm run android` / `npm run ios` | Open in an emulator or simulator           |
| `npm run lint` / `typecheck`      | ESLint (`eslint-config-expo`) / TypeScript |
| `npm run format` / `format:check` | Prettier                                   |

## Sample data

`npm run db:seed` (from `backend/`) creates a realistic dataset:

- **People:** 1 admin, 2 instructors and 16 learners
- **Courses:** 4 courses (free and paid) with 15 lessons of notes, all indexed for the AI tutor
- **Activity:** six months of enrollments, payments and progress, so the analytics charts have data

All sample accounts use the password **`Password@123`**:

| Role       | Email                   | Good for trying                                                  |
| ---------- | ----------------------- | ---------------------------------------------------------------- |
| Admin      | `admin@scholarflow.dev` | Platform overview, analytics, users and courses                  |
| Instructor | `riya@scholarflow.dev`  | Dashboard, course manager, adding lessons                        |
| Instructor | `karan@scholarflow.dev` | Revenue and analytics; enroll as a learner and watch them update |
| Learner    | `demo@scholarflow.dev`  | Enrolled courses, lesson player, AI tutor                        |

The seed only creates or replaces `@scholarflow.dev` accounts and their courses, so it is safe to run on a database that already has real users. Running it again resets the sample data.

**Try the tutor:** log in as `demo@scholarflow.dev`, open an enrolled course and ask something its lessons cover, e.g. _"Why does a closure remember variables after the function returns?"_

## API reference

Base URL: `http://localhost:3000/api` locally, or `https://scholar-flow-ai-powered-learning-ma.vercel.app/api` in production.

Send protected requests with the header `Authorization: Bearer <token>`. Errors are returned as `{ "error": "message" }` with a matching status code:

- `400`: validation failed, email already registered, or already enrolled
- `401`: not logged in
- `403`: wrong role
- `402`: payment required
- `404`: not found
- `429`: AI rate limit reached, try again shortly
- `500`: server error
- `503`: AI tutor or database unavailable

### Auth

| Method | Endpoint         | Access | Body                              | Returns                                           |
| ------ | ---------------- | ------ | --------------------------------- | ------------------------------------------------- |
| POST   | `/auth/register` | public | `{ name, email, password, role }` | Created user. `role` is `LEARNER` or `INSTRUCTOR` |
| POST   | `/auth/login`    | public | `{ email, password }`             | `{ token, user }`                                 |

### Learner

| Method | Endpoint               | Access    | Description                                                       |
| ------ | ---------------------- | --------- | ----------------------------------------------------------------- |
| GET    | `/student/courses`     | public    | Course catalogue with instructor and lesson titles                |
| POST   | `/student/enrollments` | learner   | `{ courseId }`; enrolls, and records the payment for paid courses |
| GET    | `/student/my-courses`  | logged in | Enrolled courses with progress                                    |
| GET    | `/student/learn/:id`   | enrolled  | Full course, including lesson videos, notes and PDFs              |

### AI tutor

| Method | Endpoint  | Access    | Body                      | Description                                                   |
| ------ | --------- | --------- | ------------------------- | ------------------------------------------------------------- |
| POST   | `/ai/ask` | logged in | `{ question, courseId? }` | Grounded answer with `fromNotes`, `explanation` and `sources` |

### Instructor

| Method    | Endpoint                         | Access     | Description                                                                                                |
| --------- | -------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| GET, POST | `/instructor/courses`            | instructor | List or create own courses                                                                                 |
| GET       | `/instructor/lessons?courseId=…` | instructor | Lessons in one of own courses                                                                              |
| POST      | `/instructor/lessons`            | instructor | `{ courseId, title, videoUrl?, notes?, pdfUrl? }`; creates a lesson, indexes it and returns a `rag` report |
| GET       | `/instructor/students`           | instructor | Learners in each own course, with progress                                                                 |
| GET       | `/instructor/analytics`          | instructor | Revenue, enrollments by month, per-course stats, average progress                                          |

### Admin

| Method | Endpoint             | Access | Description                                   |
| ------ | -------------------- | ------ | --------------------------------------------- |
| GET    | `/admin/stats`       | admin  | Platform totals, recent users and courses     |
| GET    | `/admin/revenue`     | admin  | Revenue and enrollments by month, top courses |
| GET    | `/admin/users`       | admin  | All users                                     |
| GET    | `/admin/courses`     | admin  | All courses with instructor and counts        |
| GET    | `/admin/enrollments` | admin  | All enrollments                               |

### System

| Method | Endpoint  | Access | Description                 |
| ------ | --------- | ------ | --------------------------- |
| GET    | `/health` | public | Database connectivity check |

Example login and question with `curl`:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@scholarflow.dev","password":"Password@123"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

curl -s -X POST http://localhost:3000/api/ai/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"question":"What is a closure?"}'
```

## Data model

```mermaid
erDiagram
    User ||--o{ Course : teaches
    User ||--o{ Enrollment : has
    User ||--o{ Payment : makes
    User ||--o{ Progress : tracks
    Course ||--o{ Lesson : contains
    Course ||--o{ Enrollment : has
    Course ||--o{ Payment : receives
    Course ||--o{ Progress : has
    Lesson ||--o{ ContentChunk : "indexed as"
```

| Model          | Purpose                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| `User`         | Name, email, bcrypt-hashed password and role (`LEARNER`, `INSTRUCTOR` or `ADMIN`)                                    |
| `Course`       | Title, description, price in ₹ (`0` means free), category, level, thumbnail and instructor                           |
| `Lesson`       | Title, video URL, notes and PDF URL                                                                                  |
| `Enrollment`   | Links a learner to a course                                                                                          |
| `Payment`      | Amount and status for paid enrollments; revenue is the sum of `SUCCESS` payments                                     |
| `Progress`     | A learner's completion percentage in a course                                                                        |
| `ContentChunk` | A piece of lesson text, its source (`notes` or `pdf`) and its `vector(768)` embedding; deleted along with the lesson |

## Authentication and roles

1. **Sign-up:** `/auth/register` hashes the password with bcrypt. Only `LEARNER` and `INSTRUCTOR` can be chosen; asking for `ADMIN` returns `403`.
2. **Login:** `/auth/login` checks the password and returns a JWT signed with `JWT_SECRET`. The token holds the user's id, email and role, and expires after 7 days.
3. **Requests:** the web app keeps the token in `localStorage`, and the mobile app keeps it in the device's secure storage. Both send it as a `Bearer` header.
4. **Checks on the server:** every protected route verifies the token and the role, and checks ownership too:
   - instructors can only see and change their own courses
   - learners can only open lessons of courses they're enrolled in
5. **Expired sessions:** if a token expires or is rejected, both apps sign the user out and return them to login.
6. **Navigation by role:**
   - learners land on the course catalogue
   - instructors land on `/teach`
   - admins land on `/admin`
   - screens for other roles are never shown

To make an admin, sign up normally and then change the user's `role` to `ADMIN` in the database, for example with `npx prisma studio`.

## Payments

Checkout runs inside a single database transaction:

1. Create a `Payment` with status `SUCCESS` (paid courses only).
2. Create the `Enrollment`.
3. Create `Progress` at 0%.

The instructor's and admin's revenue figures update straight away.

With `PAYMENT_MODE=demo` (the default), paid courses go through without charging, and the app shows a "Test mode: no real payment will be taken" notice at checkout. Set any other value to block paid enrollments with `402` until a payment gateway (such as Razorpay or Stripe) is integrated in `backend/src/lib/enroll.ts`.

## Deployment

### Backend and web on Vercel

Create **two Vercel projects from this one repository**, each with its own root directory:

| Project | Root Directory | Environment variables                                                              |
| ------- | -------------- | ---------------------------------------------------------------------------------- |
| API     | `backend`      | `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `CORS_ORIGINS` (the web app's URL) |
| Web     | `web`          | `NEXT_PUBLIC_API_URL` (the API's URL ending in `/api`)                             |

Both are detected as Next.js automatically.

After the first deploy, prepare the production database by running these from `backend/`, with `DATABASE_URL` set to the production database:

```bash
npx prisma migrate deploy
npm run rag:reindex           # embeds any lessons that existed before
```

### Mobile with EAS

Build profiles live in `mobile/eas.json`; the `preview` and `production` profiles already point at the deployed API.

```bash
cd mobile
npm install -g eas-cli
eas login
eas build -p android --profile preview      # installable APK for testing
eas build -p android --profile production   # Play Store bundle
eas build -p ios --profile production       # needs an Apple Developer account
```

## Troubleshooting

| Problem                                         | Fix                                                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Courses don't load, or the API returns `500`    | Check `backend/.env` exists and `DATABASE_URL` is correct, then open `/api/health`                                 |
| `type "vector" does not exist`                  | The database needs pgvector. Use Neon, or run `CREATE EXTENSION vector;`, then `npx prisma migrate deploy`         |
| The tutor says the model is unavailable (`404`) | Set `GEMINI_MODEL` to a current model, e.g. `gemini-3.5-flash-lite`                                                |
| The tutor says your notes don't cover a topic   | The lessons may not be indexed. Run `npm run rag:reindex` in `backend/`                                            |
| The web app shows CORS errors                   | Add the web app's exact origin (no trailing slash) to `CORS_ORIGINS` and restart or redeploy the backend           |
| The mobile app can't reach the backend          | Use your computer's LAN IP, not `localhost`; keep both devices on one Wi-Fi; restart with `npx expo start --clear` |
| A PDF isn't indexed                             | The link must be public. For Google Drive, set sharing to "Anyone with the link"                                   |
| Revenue doesn't change after enrolling          | Paid enrollments only count with `PAYMENT_MODE=demo` (or a real gateway); free courses add no revenue              |

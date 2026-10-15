# ScholarFlow API

Backend for **ScholarFlow**, a learning platform with role-based dashboards and an AI tutor that answers from each course's own material. It serves the [web app](../web) and the [mobile app](../mobile).

**Live API:** https://scholar-flow-ai-powered-learning-ma.vercel.app · **Health:** `/api/health`

## Features

- **Auth:** email and password sign-up and login, bcrypt hashing, JWT bearer tokens, three roles (learner, instructor, admin)
- **Courses:** instructors create courses and lessons (video, PDF, notes); learners browse, buy or enroll, and study
- **AI tutor (RAG):** lesson notes and PDFs are chunked, embedded with Gemini and stored in pgvector. Answers quote the notes with citations, then explain.
- **Checkout:** paid enrollments write the payment and the enrollment in one transaction
- **Analytics:** revenue, enrollments, progress and per-course breakdowns for instructors and admins

## Tech stack

Next.js 16 (route handlers) · TypeScript · PostgreSQL (Neon) + pgvector · Prisma · Zod · Google Gemini (`@google/genai`) · unpdf · Vercel

## Getting started

Requires Node.js 20+ and a PostgreSQL database with the `vector` extension available (Neon supports it).

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, GEMINI_API_KEY
npx prisma migrate deploy
npm run db:seed             # optional sample data
npm run dev                 # http://localhost:3000
```

### Environment variables

| Variable                 | Required             | Description                                                     |
| ------------------------ | -------------------- | --------------------------------------------------------------- |
| `DATABASE_URL`           | yes                  | PostgreSQL connection string                                    |
| `JWT_SECRET`             | yes                  | Secret used to sign auth tokens                                 |
| `GEMINI_API_KEY`         | yes                  | Google AI Studio key for embeddings and answers                 |
| `CORS_ORIGINS`           | yes, for the web app | Comma-separated browser origins allowed to call the API         |
| `PAYMENT_MODE`           | no                   | `demo` (default) records paid enrollments without charging      |
| `GEMINI_MODEL`           | no                   | Answer model, default `gemini-3.5-flash-lite`                   |
| `GEMINI_EMBEDDING_MODEL` | no                   | Embedding model, default `gemini-embedding-001`                 |
| `RAG_MIN_SCORE`          | no                   | Minimum cosine similarity for retrieved context, default `0.45` |

### Scripts

| Command                                                 | Description                                                                |
| ------------------------------------------------------- | -------------------------------------------------------------------------- |
| `npm run dev`                                           | Start the development server                                               |
| `npm run build`                                         | Generate the Prisma client and build for production                        |
| `npm run db:seed`                                       | Load sample users, courses and activity (`-- --no-index` skips embeddings) |
| `npm run rag:reindex`                                   | Rebuild embeddings for all lessons, or `-- <courseId>` for one course      |
| `npm run lint` · `npm run typecheck` · `npm run format` | Code quality                                                               |

### Sample accounts

After `npm run db:seed`, every sample account uses the password `Password@123`.

| Role       | Email                                       |
| ---------- | ------------------------------------------- |
| Admin      | admin@scholarflow.dev                       |
| Instructor | riya@scholarflow.dev, karan@scholarflow.dev |
| Learner    | demo@scholarflow.dev                        |

The seed only replaces `@scholarflow.dev` accounts and their courses. Admin accounts can't be created through sign-up; promote a user in the database instead.

## AI tutor

**Indexing:** runs when a lesson is created.

1. Notes and the lesson PDF are split into ~1,000-character chunks with overlap, on paragraph and sentence boundaries.
2. Each chunk is embedded with `gemini-embedding-001` (768 dimensions) and stored in `ContentChunk.embedding` (`vector(768)`).
3. The response includes an indexing report, with warnings for problems such as an inaccessible PDF. Indexing never blocks saving a lesson.

**Answering:** `POST /api/ai/ask`.

1. Retrieval is limited to courses the user can read: enrolled courses for learners, their own courses for instructors, everything for admins.
2. The question is embedded, and the top 5 chunks are selected by cosine distance.
3. Gemini returns structured JSON:
   - `fromNotes`: what the material says, with `[n]` citations
   - `explanation`: the teaching answer
   - `usedOutsideKnowledge`: set when the explanation goes beyond the notes
4. If the embedding API is unavailable, retrieval falls back to keyword search.

```jsonc
// POST /api/ai/ask  { "question": "What is a closure?", "courseId": "optional" }
{
  "fromNotes": "A closure keeps access to outer variables after the outer function returns [1].",
  "explanation": "Think of a closure as a function carrying a backpack…",
  "usedOutsideKnowledge": false,
  "sources": [
    {
      "n": 1,
      "lessonTitle": "Closures",
      "courseTitle": "JavaScript: The Hard Parts",
      "score": 0.82,
      "cited": true,
      "content": "…",
    },
  ],
  "retrieval": "vector",
}
```

## API

All endpoints except auth, the course catalogue and health require `Authorization: Bearer <token>`.

| Method    | Endpoint                                                   | Role       | Description                                                  |
| --------- | ---------------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| POST      | `/api/auth/register`                                       | public     | Create a learner or instructor account                       |
| POST      | `/api/auth/login`                                          | public     | Returns a JWT and the user                                   |
| GET       | `/api/student/courses`                                     | public     | Course catalogue (lesson titles only)                        |
| POST      | `/api/student/enrollments`                                 | learner    | Enroll, with checkout for paid courses                       |
| GET       | `/api/student/my-courses`                                  | any        | Courses the user is enrolled in                              |
| GET       | `/api/student/learn/:id`                                   | enrolled   | Full course with lesson content                              |
| POST      | `/api/ai/ask`                                              | any        | AI tutor answer with sources                                 |
| GET, POST | `/api/instructor/courses`                                  | instructor | List or create own courses                                   |
| GET, POST | `/api/instructor/lessons`                                  | instructor | List or create lessons in own courses (POST indexes for RAG) |
| GET       | `/api/instructor/students`                                 | instructor | Learners per course                                          |
| GET       | `/api/instructor/analytics`                                | instructor | Revenue, enrollments, progress, per-course stats             |
| GET       | `/api/admin/stats`                                         | admin      | Platform totals, recent users and courses                    |
| GET       | `/api/admin/users` · `courses` · `enrollments` · `revenue` | admin      | Platform data                                                |
| GET       | `/api/health`                                              | public     | Database connectivity check                                  |

## Payments

`PAYMENT_MODE=demo` records a successful payment for paid enrollments without charging, which is useful for demos and testing. Any other value rejects paid enrollments with `402` until a payment gateway is integrated in `src/lib/enroll.ts`.

## Project structure

```
prisma/              schema and migrations
scripts/             seed data and reindexing
src/
  app/api/           route handlers
  lib/
    auth.ts          JWT helpers
    http.ts          role checks and error handling
    enroll.ts        enrollment and checkout
    rag/             chunking, PDF extraction, embeddings, retrieval, answer generation
  proxy.ts           CORS
```

## Deployment

The API deploys to Vercel as a standard Next.js project. Set the environment variables in the Vercel project, then apply migrations against the production database:

```bash
npx prisma migrate deploy
npm run rag:reindex
```

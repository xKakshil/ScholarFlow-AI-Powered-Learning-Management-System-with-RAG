# ScholarFlow Mobile

iOS and Android app for **ScholarFlow**, a learning platform with an AI tutor that answers from each course's own notes. Built with Expo and React Native, on the same [backend](../backend) as the [web app](../web).

## Features

**Learners**

- Browse and search the course catalogue, filter by category
- Enroll in free courses, or buy paid courses through checkout
- Lesson player with video, notes, PDF and lesson navigation
- AI tutor: each answer shows what the course notes say (with citations), then an explanation. A floating **Ask AI** button on course and lesson screens opens the tutor scoped to that course.

**Instructors**

- Dashboard and analytics: revenue, enrollments per month, students and value per course, learner progress
- Create courses and add lessons. Notes and PDFs are indexed for the AI tutor automatically.
- Student lists per course

**Admins**

- Platform overview and analytics: revenue, sign-ups, enrollments, users by role, top courses
- Searchable users, courses and enrollments

## Tech stack

Expo SDK 57 · React Native · TypeScript · Expo Router (role-based navigation with `Stack.Protected`) · Axios · expo-secure-store · react-native-webview

## Getting started

Requires Node.js 20+ and the [Expo Go](https://expo.dev/go) app, or an Android or iOS simulator.

```bash
npm install
cp .env.example .env
npx expo start
```

Scan the QR code with Expo Go. To use a backend running on your computer, set `EXPO_PUBLIC_API_URL` to your computer's local network address (for example `http://192.168.1.10:3000/api`), not `localhost`.

### Environment variables

| Variable              | Description                                |
| --------------------- | ------------------------------------------ |
| `EXPO_PUBLIC_API_URL` | Backend base URL, ending in `/api`         |
| `EXPO_PUBLIC_WEB_URL` | Web app URL, linked from the admin profile |

### Scripts

| Command             | Description                   |
| ------------------- | ----------------------------- |
| `npm start`         | Start the Expo dev server     |
| `npm run lint`      | ESLint (`eslint-config-expo`) |
| `npm run typecheck` | TypeScript                    |
| `npm run format`    | Prettier                      |

## Builds

Builds use [EAS](https://docs.expo.dev/build/introduction/). Build profiles and their API URLs are defined in `eas.json`.

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview      # installable APK
eas build -p android --profile production   # Play Store bundle
eas build -p ios --profile production       # requires an Apple Developer account
```

## Project structure

```
src/
  app/              screens (Expo Router)
    (auth)/         login, register
    (tabs)/         learner: explore, my learning, AI tutor, profile
    course/ learn/  course details, checkout, lesson player
    ask.tsx         AI tutor sheet
    teach/ manage/  instructor dashboard, courses, students, analytics, course editor
    admin/          admin overview, analytics, users, courses, enrollments
  components/       UI kit, charts, course cards, video player
  context/          authentication
  hooks/            data loading
  lib/              API client, types, config
  screens/          screens shared between roles
```

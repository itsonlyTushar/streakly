<p align="center">
  <img src="https://res.cloudinary.com/dartdvch1/image/upload/v1774367308/screenzy-1774367244497_jrvxhq.jpg" width="100%" alt="Streakly Banner" />
</p>

# Streakly — A Developer Learning Workspace

> **Streakly** is built to help developers turn effort into durable progress. It brings goals, spaced repetition, interview prep, and daily execution into one clean workspace.

---

## 🚀 What’s New

Streakly today includes:
- **Active Goals** with locked progress and a clean archive for completed work.
- **Spaced Repetition** for study topics with review milestones, progress tracking, and reminder support.
- **DSA Arena** to capture problems, tag topics/patterns, track review due dates, and mark mastery.
- **Machine Coding Vault** for questions, step-by-step approaches, and reusable solutions.
- **Tasks & Projects** with priorities, filters, due dates, quick-add, and list management.
- **Revision Calendar** that aggregates SRS, DSA, and task due dates in one view.
- **AI Coach** powered by Gemini API key integration and contextual RAG from your goals, notes, DSA, and machine coding entries.
- **Profile tools** for Gemini API configuration, LeetCode stats, and personal progress settings.

---

## 📦 Core Features

### Goals
- Create and manage outcome-focused goals.
- Track active targets, due dates, and goal completion progress.
- Completed goals move to a read-only **Hall of Fame** archive.

### Spaced Repetition System (SRS)
- Add study topics and notes.
- Automatically schedule reviews across multi-day intervals.
- View review progress and status filters like Due, In Progress, Mastered, and Reminders.
- Email reminder support via cron.

### DSA Practice
- Log algorithm problems with difficulty, topics, patterns, and complexity.
- Schedule follow-up reviews using the same spaced repetition cadence.
- Group problems by patterns for faster practice planning.
- Save problem notes, intuition, and time/space complexity details.

### Machine Coding
- Capture coding questions, planned approach, solution code, and language.
- Keep a searchable library of machine-coding practice entries.
- Inspect full problem details in a compact table-driven interface.

### Tasks & Projects
- Organize work with task lists, project groups, and priorities.
- Mark tasks done, create new lists, and search across projects.
- See task stats like due today, overdue, and completion progress.

### Calendar & Review
- Built-in **Revision Calendar** aggregates due dates for study items, DSA reviews, and task deadlines.
- Filter by SRS, DSA, or tasks for a focused review view.

### AI Assistant
- Optional Gemini API integration for personalized study guidance.
- Context-aware chat uses your existing goals, notes, DSA problems, and machine coding entries.
- Saved conversation history and smart suggestions help you stay on track.

---

## 🧠 Project Structure

- `app/` — Next.js App Router pages and route groups.
- `components/` — UI building blocks and reusable feature components.
- `hooks/` — React query hooks for goals, tasks, SRS, DSA, machine coding, profile, and notes.
- `services/` — Firestore service layer and AI context helpers.
- `lib/` — Shared utilities, schemas, and srs scheduling logic.
- `emails/` — Email templates for reminders.

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 + React 19
- **State/Queries**: React Query / TanStack Query
- **Styling**: Tailwind CSS 4 + Framer Motion
- **Backend**: Firebase Firestore + Firebase Auth
- **Email**: Resend + React Email
- **AI**: Gemini API integration for optional chat assistance
- **Utilities**: Zod, date-fns, Lucide icons, Zustand, Radix UI

---

## 🔧 Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create environment file
Create `.env.local` in the project root with the required Firebase, Resend, and secret values.

### 3. Run the app
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## ⚙️ Environment Variables

Example values:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

RESEND_API_KEY=re_xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n"
CRON_SECRET=your_random_secret
```

> Note: AI chat requires a Gemini API key stored in the user profile page via browser local storage.

---

## 📌 Notes

- The AI assistant is optional and requires local Gemini API key configuration.
- The app includes a dedicated profile page for LeetCode integration and user settings.
- Completed goals are preserved in the Hall of Fame rather than being permanently deleted.

---

## 📜 License & Contact

Built by **Tushar**. Reach out on [GitHub](https://github.com/itsonlyTushar) for questions or collaboration.

---

<p align="center">
  <i>"Streakly helps you build the work habit, not the distraction habit."</i>
</p>

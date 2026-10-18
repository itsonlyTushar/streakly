<p align="center">
  <img src="https://res.cloudinary.com/dartdvch1/image/upload/v1774367308/screenzy-1774367244497_jrvxhq.jpg" width="100%" alt="Streakly Banner" />
</p>

# Streakly — A Developer Learning Workspace

> **Streakly** helps developers turn practice into lasting progress with spaced repetition, coding practice, and a focused revision calendar.

---

## 🚀 Core Features

- **Spaced Repetition** for study topics with review milestones and reminder support.
- **DSA Arena** to capture problems, tag topics and patterns, track review dates, and mark mastery.
- **Machine Coding Vault** for questions, step-by-step approaches, and reusable solutions.
- **Revision Calendar** for SRS reviews, DSA problems, and machine-coding practice.
- **Gemini-powered tools** for DSA auto-fill and code explanation.
- **Profile tools** for Gemini API configuration, LeetCode stats, personal settings, and full data reset.

## 🧠 Project Structure

- `app/` — Next.js App Router pages and route groups.
- `components/` — UI building blocks and reusable feature components.
- `hooks/` — React Query hooks for SRS, DSA, machine coding, profile, and notes.
- `services/` — Firestore and Gemini service layers.
- `lib/` — Shared utilities, schemas, and SRS scheduling logic.
- `emails/` — Email templates for reminders.

## 🛠 Tech Stack

- **Framework**: Next.js 16 + React 19
- **State/Queries**: React Query / TanStack Query
- **Styling**: Tailwind CSS 4 + Framer Motion
- **Backend**: Firebase Firestore + Firebase Auth
- **Email**: Resend + React Email
- **AI**: Gemini API integration for code explanation and DSA auto-fill
- **Utilities**: Zod, date-fns, Lucide icons, Zustand, Radix UI

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

## 📌 Notes

- Gemini-powered DSA auto-fill and code explanation require a local API key configured on the profile page.
- Existing Firestore documents from removed features are not deleted by this source-code change.

## 📜 License & Contact

Built by **Tushar**. Reach out on [GitHub](https://github.com/itsonlyTushar) for questions or collaboration.

---

<p align="center">
  <i>"Streakly helps you build the work habit, not the distraction habit."</i>
</p>

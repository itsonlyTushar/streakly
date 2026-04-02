<p align="center">
  <img src="https://res.cloudinary.com/dartdvch1/image/upload/v1774367308/screenzy-1774367244497_jrvxhq.jpg" width="100%" alt="Streakly Banner" />
</p>

# Streakly — A Workspace for Active Learning & Commitment

> **Streakly** is a high-intent productivity environment designed for those who value consistency over speed. It strips away the noise—the dopamine loops, the rankings, the "game" of productivity—to provide a workspace centered around real output and long-term retention.

---

## ⚡ Core Philosophy: "Intentionality First"

Streakly isn't just another notes app. Every feature is framed by two core rules:
1. **Commitment is Final**: A goal, once locked, remains. A log, once passed, is history. 
2. **Mastery Through Repetition**: Building knowledge requires structured return visits, not just one-off captures.

---

## 🚀 Key Features

### 🧠 Spaced Repetition System (SRS)
*Retain mastery through scheduled revision milestones.*
- **Automated Retention**: Log a topic and Streakly automatically schedules review windows at **1, 3, 7, and 30-day** intervals.
- **Smart Reminders**: Receive elegant, minimalist email reminders via Resend + Vercel Cron when it's time to solidify knowledge.
- **Visual Learning Path**: Track your progress with a signature "Milestone Circle" progression UI.

### 🎨 Immersive Whiteboard
*A distraction-free canvas for sketching and code dry-runs.*
- **Zero-Borders Architecture**: A true edge-to-edge workspace that lets your thoughts breathe.
- **Excalidraw-Inspired Core**: Responsive drawing, text annotations, and shape rendering.
- **Persistence**: Your whiteboard saves automatically and is tied directly to your dashboard.

### 📅 The Streak & Hall of Fame
- **The Honest Log**: Daily check-ins are locked at midnight. If you miss a day, it shows. No back-filling.
- **Hall of Fame**: Completed goals move into an immutable, read-only gallery—a permanent record of everything you have built and achieved.

---

## 🛠 Tech Stack

Streakly is built with a cutting-edge, serverless architecture for instant responsiveness:

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/)
- **Backend / DB**: [Firebase Firestore](https://firebase.google.com/docs/firestore/)
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth/) (Google, GitHub)
- **Email Service**: [Resend](https://resend.com/) + [React Email](https://react.email/)
- **Theming**: [Next Themes](https://github.com/pacocoursey/next-themes) (Dark/Light mode support)

---

## 🏗 Setup & Installation

Follow these steps to set up your local development environment:

### 1. Clone the repository
```bash
git clone https://github.com/itsonlyTushar/streakly.git
cd streakly
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory (referencing `.env.local.example`):
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

# Email & Service Account
RESEND_API_KEY=re_xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n"
CRON_SECRET=your_random_secret
```

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 📐 Design Philosophy

Streakly's UI is built on the principles of **Glassmorphism** and **High-Frequency UX**:
- **Modern Typography**: Heading: `Gravitas One` · Body: `Google Sans` · System: `Inter/Roboto`.
- **Micro-interactions**: Subtle hover states and smooth Framer Motion transitions create a premium, "living" interface.
- **Focus Mode**: Minimal sidebars and centered content areas prioritize the task at hand.

---

## 📜 License & Contact

Project built with passion by **Tushar**.  
Reach out on [GitHub](https://github.com/itsonlyTushar) for collaborations or inquiries.

---

<p align="center">
  <i>"Streakly doesn't reward you for doing the thing. It just remembers that you did."</i>
</p>

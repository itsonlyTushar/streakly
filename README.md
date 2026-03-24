![Streakly App Preview](https://res.cloudinary.com/dartdvch1/image/upload/v1774367308/screenzy-1774367244497_jrvxhq.jpg)

# Streakly

> A notes app, but better. Built for people who want to show up every day and leave a record of it.

---

## What is Streakly?

Streakly is a habit tracking app stripped down to its core — no charts, no streaks counters, no dopamine loops. Just you, a goal, and a daily note.

You add a goal with a deadline. Every day until that deadline, you write what you did. That's it. When the goal is complete, it moves to your personal Hall of Fame — a read-only archive of everything you've built.

---

## How It Works

**1. Add a Goal**
Create a new goal with a title, a short description of what you're trying to do, and a deadline. Once saved, the goal is locked — no edits, no deletions. Commitment is the point.

**2. Log Every Day**
Each day, open your active goal and write a short note about what you did. Click save. The log is timestamped and locked once the day passes — you can't go back and rewrite history.

**3. Miss a Day?**
If you skip a day, the entry still shows up on your board — marked with a 😢 to remind you. The streak is honest.

**4. Hall of Fame**
When a goal reaches its deadline with all notes logged, it moves to your Hall of Fame — a permanent, read-only record of every goal you've ever completed. No editing. Just proof.

---

## Design Philosophy

Streakly follows a strict **simplicity-first** approach:

- **Minimalist UI** — only what's needed, nothing more
- **No dashboards** — you land directly on your active goals
- **No metrics or charts** — your notes are the record
- **No delete, no undo, no excuses** — once committed, it's permanent
- **Dark & Light mode** — easy on the eyes, any time of day

Typography: `Gravitas One` for headings · `Google Sans` for body and notes

---

## Features

| Feature         | Details                                          |
| --------------- | ------------------------------------------------ |
| Goal creation   | Add title, description, and deadline             |
| Daily notes     | Write and save what you did each day             |
| Immutable logs  | Past days cannot be edited once passed           |
| Immutable goals | Goals cannot be edited or deleted after creation |
| Hall of Fame    | Completed goals archived as a read-only record   |
| Auth            | Google & GitHub sign-in via Firebase             |
| Theme           | Dark / Light mode toggle                         |

---

## Tech Stack

- **Frontend** — React / Next.js
- **Auth** — Firebase Authentication (Google, GitHub)
- **Database** — Firebase Firestore
- **Styling** — Tailwind CSS
- **Fonts** — Gravitas One, Google Sans (Google Fonts)
- **Routes** — `/` landing · `/app` active habits · `/hall-of-fame`

---

## Rules of Streakly

```
01. A goal, once added, cannot be edited or deleted.
02. A day, once passed, cannot be edited.
03. The Hall of Fame is read-only. Always.
04. There are no charts. No scores. No rankings.
05. Miss a day and it shows. That's the point.
```

---

_Streakly doesn't reward you for doing the thing. It just remembers that you did._

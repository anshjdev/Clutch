# ⚡ CLUTCH — AI Deadline Rescue System

> Built for **Vibe2Ship Hackathon** by Coding Ninjas × Google for Developers

CLUTCH is an **agentic AI productivity system** built for the moment of crisis — when you're already behind and need more than a reminder. It doesn't tell you what to do someday. It rescues you right now.

---

## 🎯 Problem Statement

**The Last-Minute Life Saver** — Students, professionals and entrepreneurs miss deadlines not because they forget, but because they panic, freeze, and don't know where to start. Existing tools offer passive reminders. CLUTCH offers rescue.

---

## 🤖 Agentic Architecture

CLUTCH implements **5 autonomous AI agents** powered by Gemini 2.0 Flash function calling:

| Agent | What it does autonomously |
|---|---|
| **Triage Agent** | Analyzes all tasks → assigns urgency/impact scores → builds priority matrix |
| **Rescue Agent** | Generates step-by-step micro-action plans with time estimates per step |
| **Check-in Agent** | Proactively fires alerts without being prompted — based on deadline proximity |
| **Scheduler Agent** | Books optimal calendar time blocks for all tasks automatically |
| **Email Draft Agent** | Writes a professional extension request email when deadline is impossible |

All agents use **Gemini function calling** — not plain text prompts — to return structured, actionable data.

---

## ✨ Key Features

- **🚨 Triage Mode** — Panic dump all tasks, Gemini assigns CRITICAL / HIGH / MEDIUM / LOW with urgency × impact matrix
- **🩺 Rescue Plans** — Not reminders. Step-by-step micro-actions: "Write the intro paragraph — 12 min"
- **📊 Can I Still Make It?** — Honest survival probability (0–100%) + rescue plan based on your actual deadline and progress
- **🎤 Voice Panic Dump** — Speak your chaos, Gemini structures it into tasks instantly
- **📷 Snap & Plan** — Photo of assignment / handwritten notes → Gemini Vision extracts all tasks
- **📅 Auto-Schedule** — Agent books time blocks across your free slots without manual input
- **✉️ Auto Email Drafter** — Impossible deadline? Agent writes the extension email for you
- **🤖 Proactive Check-ins** — AI messages you autonomously: "2 hours left, you're at 40%. Here's what to do."

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| AI Core | **Gemini 2.0 Flash** via `@google/generative-ai` |
| Agentic behavior | **Gemini Function Calling** (5 tool declarations) |
| Vision | **Gemini Multimodal** (image → task extraction) |
| Voice | Web Speech API + Gemini |
| State | Zustand (persisted) |
| Deployment | Google AI Studio |

---

## 🚀 Setup

### 1. Clone & install
```bash
git clone https://github.com/YOUR_USERNAME/clutch.git
cd clutch
npm install
```

### 2. Add Gemini API key
```bash
cp .env.example .env
# Edit .env and add your key:
# VITE_GEMINI_API_KEY=your_key_here
```
Get a free key at [aistudio.google.com](https://aistudio.google.com)

### 3. Run locally
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

---

## 📁 Project Structure

```
src/
├── api/
│   └── gemini.js          # Gemini client + 5 function declarations
├── agents/
│   ├── triageAgent.js     # Task priority matrix
│   ├── rescueAgent.js     # Rescue plan + Can I Make It
│   ├── checkinAgent.js    # Autonomous proactive alerts
│   ├── schedulerAgent.js  # Auto calendar scheduling
│   └── emailDraftAgent.js # Extension email writer
├── components/
│   ├── Dashboard.jsx      # Home + task overview
│   ├── TriageBoard.jsx    # Priority matrix UI
│   ├── RescuePlan.jsx     # Rescue steps + email drafter
│   ├── CanIMakeIt.jsx     # Deadline analyzer
│   ├── ScheduleView.jsx   # Calendar blocks
│   ├── SnapPlan.jsx       # Vision-based task extraction
│   ├── TaskInput.jsx      # Voice + text input
│   ├── CheckinAlert.jsx   # Proactive alert toasts
│   └── Sidebar.jsx        # Navigation
├── hooks/
│   ├── useVoice.js        # Web Speech API hook
│   └── useCheckinAgent.js # Agent lifecycle hook
├── store/
│   └── taskStore.js       # Zustand global state
└── utils/
    └── timeUtils.js       # Time formatting helpers
```

---

## 🏆 Google Technologies Used

- **Gemini 2.0 Flash** — Core AI model for all agents
- **Gemini Function Calling** — Structured agentic output (5 tools)
- **Gemini Vision / Multimodal** — Image-to-task extraction (Snap & Plan)
- **Google AI Studio** — Development + deployment platform

---

*Built with ⚡ by Ansh | Vibe2Ship 2026*

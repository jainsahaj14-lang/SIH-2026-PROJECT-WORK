# CogniCare NER 🧠🌿
> **AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in the North Eastern Region (NER) of India**

---

## 🌟 Executive Overview
**CogniCare NER** is an **offline-first**, **multilingual**, and **AI-adaptive** digital cognitive therapy and daily memory platform tailored specifically for elderly individuals experiencing mild-to-moderate dementia and Mild Cognitive Impairment (MCI) across the North Eastern Region of India (Assam, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, Arunachal Pradesh, Sikkim).

The application is engineered to operate **100% locally with zero cloud dependencies**, adhering strictly to geriatric design standards, regional linguistic requirements, and low-connectivity environments.

---

## 🏗️ Architecture & Technology Stack

### Monorepo Structure
```
sih/
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── components/         # Navbar, OfflineBanner, ReminderAlertModal, VoiceSpeaker
│   │   ├── db/                 # Dexie.js (IndexedDB) schema & SyncManager
│   │   ├── i18n/               # react-i18next config & JSON locales (en.json, as.json)
│   │   ├── pages/              # Home, GamesHub, MemoryMatch, RoutineRecall, Reminders, Dashboard, Login
│   │   ├── services/           # API client, Web Speech API TTS, NotificationService
│   │   ├── App.jsx             # Router, PWA setup, background listeners
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Elderly-accessible design system (min 64px tap targets)
│   ├── public/                 # PWA manifest, brain SVG icon, service worker assets
│   ├── vite.config.js          # Vite + VitePWA Workbox offline caching plugin
│   └── package.json
├── server/                     # Node.js + Express API
│   ├── config/
│   │   └── db.js               # MongoDB connection + auto MongoMemoryServer fallback
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   └── roleGuard.js        # Role-based authorization (patient, caregiver, healthworker, admin)
│   ├── models/
│   │   ├── User.js             # User accounts (email/password or patient PIN)
│   │   ├── Patient.js          # Patient baseline & difficulty tiers (memory, routine, etc.)
│   │   ├── GameSession.js      # Gameplay analytics (accuracy, response time, hesitation count)
│   │   ├── Reminder.js         # Medication, hydration, activity, appointment reminders
│   │   └── CognitiveScore.js   # Aggregated weekly trajectory
│   ├── routes/
│   │   ├── auth.js             # Register, login, simplified 4-digit PIN patient login
│   │   ├── patients.js         # Patient profiles & stats
│   │   ├── gameSessions.js     # Single and batch IndexedDB sync endpoints
│   │   ├── reminders.js        # CRUD, one-tap acknowledge, offline sync
│   │   ├── dashboard.js        # Aggregated caregiver dashboard metrics & alert banners
│   │   └── uploads.js          # Medicine strip / pill photo uploads
│   ├── services/
│   │   ├── difficultyEngine.js # Adaptive difficulty algorithm (rule-based + ML ready)
│   │   └── reminderCron.js     # Node-cron background reminder monitoring
│   ├── seeds/
│   │   └── seedData.js         # Demo database seeder
│   ├── .env                    # Local environment configuration
│   ├── server.js               # Express entry point & static SPA server
│   └── package.json
├── package.json                # Root automation scripts
└── README.md
```

---

## 🎮 Game Modules (MVP)

### 1. Memory Match (স্মৃতি মিল খেল)
* **Design:** Flip-card pairing featuring culturally resonant North Eastern and everyday items:
  * 👒 Japi (Traditional Assamese hat)
  * ☕ Assam Tea Cup
  * 🥁 Bihu Dhol (Drum)
  * 🦏 Kaziranga Rhino
  * 🎋 Bamboo Craft
  * 🌼 Mustard Flower
  * 🧣 Traditional Gamosa Motif
  * 🪔 Diya Lamp
* **3 Difficulty Tiers:**
  * **Level 1 (Gentle):** 4 pairs (8 cards, 4x2 grid)
  * **Level 2 (Balanced):** 6 pairs (12 cards, 4x3 grid)
  * **Level 3 (Challenging):** 8 pairs (16 cards, 4x4 grid)
* **Metrics Tracked:** Accuracy %, average response time per flip (ms), and **Hesitation Count** (pauses $>3$ seconds).
* **Audio:** Web Speech API TTS reads spoken instructions in Assamese (`as`) or English (`en`) automatically before starting.

### 2. Daily Routine Recall (দৈনন্দিন কামৰ নিয়ম)
* **Design:** Chronological sequencing of essential daily activities (Wake up 🌅 → Brush teeth 🪥 → Bathing 🚿 → Eat meal 🍲 → Evening walk 🚶‍♂️ → Sleep 🌙).
* **3 Difficulty Tiers:**
  * **Level 1:** 3-step sequence with 1 distractor icon
  * **Level 2:** 4-step sequence with 2 distractor icons
  * **Level 3:** 5-step sequence with 2-3 distractor icons
* **Interaction:** Elderly-friendly tap-to-order slots with instant tap-to-remove adjustments and celebratory confetti feedback.

---

## 🧠 Adaptive Difficulty Engine (`difficultyEngine.js`)

Exposed via `GET /api/patients/:id/next-difficulty/:gameType`. Evaluates the patient's rolling 3-session window:
1. **Accuracy $>85\%$:** Advances difficulty tier by $+1$ (max 3).
2. **Accuracy $<50\%$:** Decreases difficulty tier by $-1$ (min 1) to reduce cognitive distress.
3. **Accuracy Stable ($50-85\%$) but Response Time Trending Up $>20\%$:** Flags `possible_fatigue` without altering tier, protecting the patient from overstimulation.
4. **Stable Decoupled Interface:** Designed with clean separation (`sessions, currentTier -> { nextTier, tierChange, flags, stats }`) allowing seamless drop-in replacement by a scikit-learn / ONNX classifier in Phase 2.

---

## ⏰ Reminders & Offline Notifications

* **Types:** Medicine, Hydration, Daily Activity, Doctor Appointments.
* **Offline Operation:** All scheduled reminders are cached locally in **Dexie.js (IndexedDB)**.
* **Alert System:** Checks every minute via local background interval, synthesizes a Web Audio gentle chime, and triggers an in-app visual modal + browser notification even with the internet disconnected.
* **One-Tap Acknowledgment:** Large 64px button labeled *"I Took This / মই খালো"*. Queued offline and pushed to `/api/reminders/batch-acknowledge` upon reconnect.
* **Visual Pill Guide:** Supports optional photo uploads or base64 previews of medication packaging so elderly patients visually identify their pills.

---

## 📊 Caregiver & Clinician Dashboard (`/dashboard`)

* **Active Alert Banners:**
  * Missed reminder by $>2$ hours
  * Adaptive engine flagged `possible_fatigue`
  * Inactivity alert: No session logged in $3+$ days
* **Cognitive Trajectory:** Interactive **Recharts** line chart plotting session accuracy % and response time trends.
* **Weekly Adherence Rate:** Visual progress percentage of acknowledged vs scheduled medications and tasks.
* **Historical Sessions Table:** Breakdown of game type, tier, accuracy, hesitation pauses, and date/time.

---

## 🌐 Multilingual & Geriatric Accessibility

* **zero Hardcoded Strings:** Fully externalized to `client/src/i18n/locales/en.json` and `as.json` (Assamese - অসমীয়া). Structure allows adding Bodo, Khasi, Mizo, Nepali, Manipuri, and Hindi simply by adding JSON packs.
* **"Simple Mode" Toggle:** Switches the entire interface to an ultra-simplified 3-button layout:
  1. 🎮 **Play Games** (*স্মৃতি খেলক*)
  2. ⏰ **Reminders** (*ঔষধ আৰু যত্ন*)
  3. 📞 **Call Caregiver** (*সহায়কক মাতক*)
* **Accessibility Targets:** Minimum 64px tap targets, high contrast ratios, large typography (18px-24px baseline), and Web Speech API audio assistance on every card.

---

## 🚀 Local Run Instructions (Zero Cloud Setup)

The project includes an automatic embedded MongoDB fallback (`MongoMemoryServer`) so that you can run and demo the full platform **even if MongoDB Community Server is not installed or running locally**!

### 1. Unified Instant Start (Production Demo)
Runs both the backend API and serves the production React client on a single port:
```bash
# From repository root
npm run server
```
* **Web Application:** [http://localhost:5000](http://localhost:5000)
* **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

*(The database auto-seeds the demo patient and caregiver records if empty!)*

---

### 2. Development Mode (Separate Client & Server)

#### Terminal 1 — Backend:
```bash
cd server
npm run dev
# Express server listening on http://localhost:5000
```

#### Terminal 2 — Frontend (Vite):
```bash
cd client
npm run dev
# React app available at http://localhost:5173 (proxies /api to 5000)
```

---

### 3. Running with Local MongoDB (Optional)
If you have local MongoDB Community installed:
```bash
mongod --dbpath ./data/db
```
The server will automatically connect to `mongodb://localhost:27017/cognicare_ner`. If not running, it automatically switches to embedded mode.

---

### 4. Re-running the Seed Script
To reset and re-populate the demo accounts and session history:
```bash
# From repository root
npm run seed
```

---

## 🔑 Demo Credentials

| Role | Name | Login Method | Credentials |
| :--- | :--- | :--- | :--- |
| **Elderly Patient** | Bhaben Baruah (ভাবেন বৰুৱা) | **Simplified 4-Digit PIN** | PIN: `1234` |
| **Family Caregiver** | Priya Sharma (প্ৰিয়া শৰ্মা) | **Email + Password** | `caregiver@cognicare.ner` / `password123` |

*(Both login screens include one-tap demo fill buttons for quick judging and review!)*

---

## 📴 Offline Testing Verification
1. Open [http://localhost:5000](http://localhost:5000) in Chrome/Edge/Firefox.
2. Open **DevTools (F12)** → **Network tab** → Select **Offline**.
3. Notice the top banner updates to **Offline Mode active**.
4. Play **Memory Match** or **Routine Recall** — games, animations, scoring, and TTS continue to function seamlessly.
5. Acknowledge a medication reminder in **Reminders**.
6. In DevTools, set the Network back to **Online** or click **Sync Now**.
7. The background `SyncManager` pushes the stored IndexedDB session logs and acknowledgments to the Express API.

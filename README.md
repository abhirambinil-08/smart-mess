# 🍱 MateMess — Ultimate Mess Companion v2.0

**MateMess** is a premium, AI-driven, offline-first feedback ecosystem designed for campus dining. It transforms raw student data into professional administrative intelligence using state-of-the-art Generative AI.

---

## 🌟 Key Modernisations (v2.0)

- **🧠 Gemini 3 Flash AI**: Real-time sentiment analysis that reads student comments to provide actionable "Action Plans."
- **📥 Professional Word Export**: One-click generation of fully formatted `.docx` reports for management meetings.
- **📡 Stable Tunneling**: Optimized IPv4 and SSL-ready relative API mapping for 100% stable mobile access via Localtunnel.
- **🛰️ Offline-First PWA**: Background synchronization allows students to submit feedback even with zero connectivity.
- **🎨 Glassmorphism UI**: A high-end, dark-mode design system with premium aesthetics and smooth transitions.

---

## 🛠️ Tech Stack

| Layer          | Technology                                   |
|----------------|----------------------------------------------|
| **Frontend**   | React 18 + Vite + **Vite PWA**               |
| **Backend**    | FastAPI (Python) + **Gemini 3 Flash AI**    |
| **Database**   | MongoDB (Motor async)                        |
| **Reporting**  | **python-docx** + SMTP Email                 |
| **Tunnels**    | Localtunnel with optimized startup delays   |
| **Storage**    | IndexedDB (for offline sync)                 |

---

## 🚀 One-Click Quick Start

The quickest way to start the entire ecosystem (Backend, Frontend, and Public Tunnel) is using the new PowerShell launcher:

```powershell
.\start-smartmess.ps1
```
*This script automatically configures the environments and waits 10 seconds for stability before opening your public mobile link.*

---

## 📂 Advanced Features

### 🧠 AI Analytics & Insights
Admins no longer need to sift through thousands of scores. The **Gemini Analytics** engine:
1. Aggregates real-time comments.
2. Identifies specific hygiene or taste issues.
3. Suggests professional recommendations.
4. Exportable as a **Professional Word Document**.

### 📡 Connectivity (Remote Access)
Built specifically for campus environments with poor signal:
- **Relative API Mapping**: Works seamlessly on both `http://localhost` and `https://loca.lt` without CORS or Mixed Content errors.
- **IPv4 Binding**: Uses explicit `127.0.0.1` binding to prevent tunnel disconnects.

### 🛡️ FeedGuard — Fraud Detection
Uses advanced AI scoring to detect:
- Randomly selected MCQ answers.
- Fake / Bot submissions.
- Duplicate patterns.
*Suspicious users are flagged, and their token rewards are automatically revoked.*

---

## 🎮 Gamification & Rewards

Students earn tokens for genuine feedback, unlocking premium rewards:

| Level | Tokens | Reward |
| :--- | :--- | :--- |
|  Beginner | 0—154 | Keep going! |
| Food Explorer | 155—369 | Extra fruit |
| Mess Legend | 1600—2999 | Free snack or drink |
| Ultimate Foodie | 3000+ | Special snack pass |

---

## 📧 Enterprise Reporting

Configure Gmail SMTP in `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```
*Supports automated Weekly, Monthly, and Yearly reports to multiple administrator emails.*

---

Built with ❤️ by Team MateMess

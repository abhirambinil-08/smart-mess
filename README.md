# 🍱 Smart Mess Feedback System v2

A full-stack, production-ready QR-based feedback system for educational institution mess/canteens.

---

## 🏗️ Tech Stack

| Layer     | Technology                                  |
|-----------|---------------------------------------------|
| Frontend  | React 18 + Vite + React Router              |
| Backend   | FastAPI (Python) + Uvicorn                  |
| Database  | MongoDB (Motor async driver)                |
| Auth      | JWT tokens (python-jose + bcrypt)           |
| Charts    | Chart.js + react-chartjs-2                  |
| QR Codes  | qrcode (PIL)                                |
| Email     | SMTP (smtplib) — works with Gmail           |

---

## 📁 Folder Structure

```
mess-system-v2/
├── backend/
│   ├── core/
│   │   ├── database.py       # MongoDB connection + indexes
│   │   └── security.py       # JWT + RBAC dependencies
│   ├── models/
│   │   └── schemas.py        # All Pydantic request/response shapes
│   ├── routes/
│   │   ├── auth.py           # Login, register, staff creation
│   │   ├── feedback.py       # Submission, image upload, history
│   │   ├── questions.py      # Dynamic MCQ management
│   │   ├── tokens.py         # Token balance, redeem, leaderboard
│   │   ├── dashboard.py      # Analytics aggregation
│   │   ├── ai_insights.py    # AI analysis + email reports
│   │   ├── qr_code.py        # QR code PNG generation
│   │   └── mess_config.py    # Mess CRUD
│   ├── services/
│   │   ├── token_service.py  # Token award logic (rare 10 = 5%)
│   │   ├── time_service.py   # Time slot enforcement
│   │   └── ai_insights.py    # Hygiene analysis + HTML email
│   ├── main.py               # FastAPI app entry point
│   ├── requirements.txt
│   └── .env                  # Config (MongoDB, JWT, SMTP)
│
└── frontend/
    └── src/
        ├── context/
        │   └── AuthContext.jsx       # Global auth state
        ├── utils/
        │   └── api.js                # All API calls
        ├── components/
        │   └── AdminLayout.jsx       # Sidebar shell
        ├── pages/
        │   ├── LoginPage.jsx         # Universal login
        │   ├── RegisterPage.jsx      # Voter self-registration
        │   ├── FeedbackPage.jsx      # MCQ + emoji public form
        │   ├── VoterDashboard.jsx    # Tokens, rewards, history
        │   ├── AdminDashboard.jsx    # Analytics with charts
        │   ├── AdminMessPage.jsx     # Mess CRUD
        │   ├── AdminStaffPage.jsx    # Staff credential generator ✅ Req #13
        │   ├── AdminInsightsPage.jsx # AI insights + email reports
        │   ├── AdminUsersPage.jsx    # User management + token control
        │   ├── QuestionsPage.jsx     # Dynamic MCQ management
        │   └── QrPage.jsx            # QR code generator
        ├── App.jsx                   # Routes for all roles
        ├── index.css                 # Design system
        └── main.jsx
```

---

## 🚀 Setup & Run

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and edit .env file
cp .env .env.local
# Edit: MONGO_URL, JWT_SECRET, SMTP_USER, SMTP_PASS

uvicorn main:app --reload
# API runs at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

### 3. Create First Admin

```bash
curl -X POST http://localhost:8000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mess.com","password":"admin123"}'
```

---

## 👥 Roles & Access

| Feature                      | Admin | Mess Staff | Voter |
|------------------------------|-------|------------|-------|
| View dashboard & charts      | ✅    | ✅ (read)  | ❌    |
| Submit feedback              | ❌    | ❌         | ✅    |
| Manage questions             | ✅    | ✅         | ❌    |
| Create mess locations        | ✅    | ❌         | ❌    |
| View AI insights             | ✅    | ✅ (read)  | ❌    |
| Send email reports           | ✅    | ❌         | ❌    |
| Create staff accounts        | ✅    | ❌         | ❌    |
| Adjust user tokens           | ✅    | ❌         | ❌    |
| See online users             | ✅    | ❌         | ❌    |
| View own tokens & rewards    | ❌    | ❌         | ✅    |

---

## 🕒 Feedback Time Slots

| Slot      | Window           |
|-----------|------------------|
| Morning   | 7:00 AM – 11:00 AM |
| Afternoon | 1:00 PM – 3:00 PM  |
| Evening   | 7:00 PM – 10:00 PM |

**Rules:**
- Max 1 feedback per slot per day
- Max 3 feedbacks per day total

---

## 🪙 Token System

- Each feedback submission awards **1–9 tokens** (95% chance)
- **10 tokens** is a **rare reward** (only 5% chance!)
- Tokens accumulate and unlock levels + rewards

| Level            | Tokens Required | Reward                        |
|------------------|-----------------|-------------------------------|
| 🌱 Beginner      | 0–154           | Keep going!                   |
| 🍎 Food Explorer | 154–369         | Extra fruit 🍎                |
| 🌟 Mess Influencer | 369–649       | Extra roti / add-on 🫓        |
| 🎩 Food Critic   | 649–1599        | Priority serving (skip line) ⚡ |
| 🏆 Mess Legend   | 1599–2999       | Free snack or drink 🥤        |
| 👑 Ultimate Foodie | 2999+         | Special snack pass 🎁         |

---

## 📊 Database Collections (MongoDB)

| Collection       | Purpose                              |
|------------------|--------------------------------------|
| `users`          | All users (admin, mess_staff, voter) |
| `feedback`       | All submitted feedback               |
| `questions`      | Custom MCQ questions                 |
| `mess`           | Mess locations                       |
| `online_sessions`| Track who is logged in               |
| `redemptions`    | Reward redemption log                |
| `token_logs`     | Admin token adjustment history       |

---

## ✉️ Email Reports

Configure Gmail SMTP in `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password   # Use Gmail App Password (2FA required)
```

Supports: **Weekly / Monthly / Yearly** reports to **multiple recipients**.

---

## 🔑 Requirement #13 — Staff Credential Generator

Admin can go to `/admin/staff` to:
1. Enter staff name, email, department
2. Set or auto-generate a password
3. Click "Create Staff Account"
4. A credential card appears showing login email + password
5. Copy credentials button copies to clipboard for sharing

---

Built with ❤️ by Team SmartMess

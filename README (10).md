<div align="center">

# 🔍 DevLens
### AI-Powered Developer Intelligence Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-DevLens-6366f1?style=for-the-badge&logo=render&logoColor=white)](https://devlens-github-analytics.onrender.com)
[![API Status](https://img.shields.io/badge/Backend%20API-Live-22c55e?style=for-the-badge&logo=express&logoColor=white)](https://devlens-github-analytics-api.onrender.com/api/health)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Dashwanth15/devlens-github-analytics)

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini_AI-8E75B2?style=flat-square&logo=google&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)

</div>

---

## 📌 Overview

**DevLens** is a full-stack developer intelligence platform that goes far beyond a standard GitHub profile viewer. It fetches and analyzes real GitHub data to generate developer scores, predict career trajectories, match candidates to job descriptions, verify resumes against actual GitHub activity, and rank candidates — all powered by the **Google Gemini AI** and a production-ready REST API.

Built as a portfolio-grade project showcasing end-to-end product thinking: real API integrations, AI-driven features, recruiter-facing tools, and a polished multi-page React dashboard.

---

## 🌐 Live Demo

| Resource | Link |
|---|---|
| 🖥️ Frontend | [devlens-github-analytics.onrender.com](https://devlens-github-analytics.onrender.com) |
| ⚙️ Backend API | [devlens-github-analytics-api.onrender.com](https://devlens-github-analytics-api.onrender.com/api/health) |
| 📦 Repository | [github.com/Dashwanth15/devlens-github-analytics](https://github.com/Dashwanth15/devlens-github-analytics) |

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🧑‍💻 **GitHub Profile Analysis** | Fetches repos, stars, followers, commit activity, and language breakdowns via the GitHub API |
| 📊 **Developer Scoring** | Algorithmic scoring system based on activity, repo quality, and open-source contributions |
| 🔎 **Repository Intelligence** | Per-repo analytics including stars, forks, language, and recency signals |
| ⚖️ **Profile Comparison** | Side-by-side comparison of two GitHub developers across all metrics |
| 📈 **Career Intelligence & Predictions** | Predicts career trajectory using GitHub activity patterns — no AI key needed |
| 📄 **Resume Verification** | Uploads a PDF resume and cross-checks claims against real GitHub data using Gemini AI |
| 💼 **Job Matching** | Paste a job description and get AI-ranked candidate fit scores |
| 🏆 **Candidate Ranking** | Rank multiple developers against a role using Gemini-powered analysis |
| 🤖 **AI Insights** | Gemini AI narrates developer strengths, weaknesses, and growth areas |

---

## 🛠️ Tech Stack

**Frontend**
- React 19 + Vite 8
- React Router v7
- Recharts (data visualizations)
- Framer Motion (animations)
- Lucide React (icons)

**Backend**
- Node.js + Express 4
- Helmet (security headers)
- express-rate-limit (API protection)
- Multer (PDF upload handling)
- pdf-parse (resume text extraction)

**Database**
- MySQL 8 via `mysql2` with connection pooling
- Hosted on **Railway**

**AI Integration**
- Google Gemini AI (`@google/generative-ai`) — resume verification, job matching, candidate ranking

**Deployment**
- Frontend → **Render** (static site)
- Backend → **Render** (web service)
- Database → **Railway** (managed MySQL)

---

## 🏗️ Architecture Overview

```
React Frontend (Render)
        │
        ▼
Express REST API (Render)
     ├── GitHub API  →  Profile / Repo Data
     ├── Gemini AI   →  Resume, Jobs, Ranking
     └── MySQL DB    →  Cached Profiles & Analytics (Railway)
```

The backend acts as a secure proxy and intelligence layer — caching GitHub data in MySQL, enriching it with AI analysis, and serving clean JSON to the frontend.

---

## 🖥️ Screens & Modules

| Module | Description |
|---|---|
| **Dashboard** | Overview of a searched developer — stats grid, scores, language chart, top repos |
| **Discover** | Browse and search previously analyzed GitHub profiles |
| **Profiles** | Detailed profile view with full repo list, score breakdown, and AI insights |
| **Compare** | Head-to-head comparison of two developers across all dimensions |
| **Analytics** | Deep-dive charts — commit frequency, language distribution, contribution trends |
| **Career Intelligence** | Algorithmic prediction of career direction based on activity signals |
| **Resume Verification** | PDF upload → Gemini AI verifies resume claims against live GitHub data |
| **Job Match** | Paste a job description → AI scores candidate fit |
| **Candidate Ranking** | Enter multiple GitHub usernames → AI ranks them for a given role |

---

## 🚀 What Was Built Beyond a Basic Analyzer

- Built a **complete AI-powered Developer Intelligence Platform** instead of a simple profile viewer
- Designed a **multi-module React dashboard** with 9 distinct pages and animated UI
- Integrated **Google Gemini AI** for resume verification, job matching, and candidate ranking
- Implemented **career prediction** using algorithmic analysis of GitHub activity (no AI key required)
- Built a **recruiter-focused toolset** — ranking, job match, and resume audit in one platform
- Developed a **developer scoring engine** combining activity, quality, and contribution signals
- Built a **production-ready backend** with rate limiting, CORS policy, Helmet security, and error handling
- Applied **MySQL connection pooling** for efficient cloud database performance
- Deployed across three cloud platforms: **Render (×2) + Railway**

---

## ⚙️ Installation

### Prerequisites
- Node.js ≥ 18
- MySQL 8 database
- GitHub Personal Access Token (scopes: `public_repo`, `read:user`)
- Google Gemini API key *(optional — required only for AI features)*

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your credentials in .env
npm run db:init    # Initialize MySQL schema
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
# Create .env with VITE_API_URL=http://localhost:5000
npm run dev
```

### Environment Variables

```env
# Backend .env
PORT=5000
DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=github_analyzer
GITHUB_TOKEN=your_github_pat
GEMINI_API_KEY=your_gemini_key   # Optional
CLIENT_URL=http://localhost:5173
```

---

## 🔭 Future Enhancements

- 🔐 **GitHub OAuth login** for personalized dashboards
- 📬 **Email alerts** for developer activity milestones
- 🌐 **Team / org-level analytics** for engineering managers
- 📉 **Trend tracking** — watch how a developer's score changes over time
- 🔗 **Shareable public profile links** for devs to send to recruiters
- 🧩 **ATS integration** export for candidate ranking results
- 📱 **Mobile-responsive redesign** with PWA support

---

## 👤 Author

**Dashwanth Madduri**
[![GitHub](https://img.shields.io/badge/GitHub-Dashwanth15-181717?style=flat-square&logo=github)](https://github.com/Dashwanth15)

---

## 🙏 Acknowledgements

- [**GitHub REST API**](https://docs.github.com/en/rest) — developer data source
- [**Google Gemini AI**](https://ai.google.dev/) — AI analysis and insights
- [**Render**](https://render.com) — frontend and backend hosting
- [**Railway**](https://railway.app) — managed MySQL database

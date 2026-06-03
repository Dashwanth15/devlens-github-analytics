# DevLens Render Deployment Blueprint & Guide

This guide details the exact configurations, checklists, and configurations required to successfully deploy the DevLens full-stack platform (React + Node.js + MySQL) to Render without build, runtime, CORS, or database failures.

---

## 📋 Phase 1: Pre-Push Checklist (Before GitHub Push)

### 1. Files to Remove / Keep Out of Git
- [ ] Confirm no `.env` files are tracked by git. Run the following command in your terminal to check for tracked env files:
  ```bash
  git status --ignored
  ```
- [ ] Verify that `backend/node_modules`, `frontend/node_modules`, `backend/logs`, and `frontend/dist` are not tracked.
- [ ] Check if `frontend/.gitignore` contains the newly added ignore rules for environment files.

### 2. Verify Security / Secrets Configuration
- [ ] Ensure that no real API keys (e.g. Google Gemini API keys, GitHub Tokens) or database credentials are hardcoded in any `.js`, `.jsx`, or config files.
- [ ] Confirm that `backend/src/config/env.js` correctly handles optional variables such as `GEMINI_API_KEY` (using fallback mock data if omitted).

---

## 🛠️ Phase 2: Render Service Configurations

Since the project has separate `backend` and `frontend` folders, they should be deployed as two separate services on Render:
1. **DevLens API** (Web Service)
2. **DevLens Web App** (Static Site)

### 1. Backend Web Service Configuration (DevLens API)

| Configuration Field | Value | Rationale |
| :--- | :--- | :--- |
| **Service Type** | Web Service | Node.js Express server |
| **Name** | `devlens-api` | Identifies your API |
| **Environment** | `Node` | Runtime environment |
| **Root Directory** | `backend` | Build is isolated to the backend directory |
| **Build Command** | `npm install` | Installs backend dependencies |
| **Start Command** | `npm run db:init && npm start` | **Crucial:** Initializes MySQL tables automatically on database startup, then boots the server. Safe to run repeatedly. |

#### Required Environment Variables (Backend Web Service)

Set the following variables in the **Environment** tab of your Render Web Service:

| Variable Name | Example/Recommended Value | Description / Rationale |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production mode and error sanitization |
| `PORT` | `10000` | Optional (Render overrides this automatically) |
| `DB_HOST` | `your-mysql-host.railway.app` | MySQL Database Host URL (Railway, Aiven, etc.) |
| `DB_PORT` | `3306` | Port of your external MySQL instance |
| `DB_USER` | `root` | Database username |
| `DB_PASSWORD` | `your-db-password` | Database password |
| `DB_NAME` | `github_analyzer` | Database name |
| `DB_SSL` | `true` | **Recommended:** Auto-enables secure SSL connection for external hosts (e.g., Aiven, Railway) |
| `GITHUB_TOKEN` | `ghp_yourPersonalAccessToken` | Personal access token with `public_repo` and `read:user` permissions |
| `CLIENT_URL` | `https://devlens-app.onrender.com` | **CORS Origin:** URL of your frontend static site (supports comma-separated values if you have multiple origins) |
| `GEMINI_API_KEY` | `AIzaSyYourGeminiAPIKey` | **Optional:** Key for AI resume parsing, job match engine, and candidate ranking. If omitted, mock engines are used. |

---

### 2. Frontend Static Site Configuration (DevLens Web App)

| Configuration Field | Value | Rationale |
| :--- | :--- | :--- |
| **Service Type** | Static Site | Vite React frontend |
| **Name** | `devlens-app` | Frontend application name |
| **Root Directory** | `frontend` | Build is isolated to the frontend directory |
| **Build Command** | `npm install && npm run build` | Installs dependencies and builds Vite static distribution |
| **Publish Directory** | `dist` | Path relative to root directory where index.html resides |

#### Required Environment Variables (Frontend Static Site)

Set this variable in the **Environment** tab of your Render Static Site **before triggering a build**:

| Variable Name | Recommended Value | Description / Rationale |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://devlens-api.onrender.com/api` | **Crucial:** Points your React client to the Render backend service. Note: This variable is baked into the code *at build time*. |

#### 🔄 SPA Routing Redirect Rule (Crucial for React Router)
Because DevLens uses client-side routing (`react-router-dom`), refreshing any route other than `/` will return a `404 Not Found` error by default. You **MUST** add a redirect/rewrite rule in the Render Dashboard:

1. In your Static Site settings, go to the **Redirects/Rewrites** tab.
2. Click **Add Rule**.
3. Configure the rule as follows:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite` (NOT Redirect)
4. Click **Save**.

---

## 🧪 Phase 3: Post-Deployment Verification Checklist

### 1. Health Checks
- [ ] Access the API health check URL: `https://devlens-api.onrender.com/api/health`
- [ ] Confirm the JSON response indicates `success: true` and lists the active environment as `production`.

### 2. Database Connection Verification
- [ ] Open the Render logs for `devlens-api`.
- [ ] Confirm you see `✅ MySQL connected successfully` and `✅ Table ... created (or already exists)` logs during startup.
- [ ] If the DB connection failed on the first attempt, confirm the retry loop backoff logs printed and it successfully connected on a subsequent try.

### 3. CORS & API Integration Tests
- [ ] Open the DevLens Web App in your browser.
- [ ] Open the Browser Developer Console (F12) and check the network tab.
- [ ] Run a profile analysis (e.g. look up your own GitHub username).
- [ ] Confirm the request goes through successfully without CORS blocking errors (HTTP 403) or database errors (HTTP 500).
- [ ] Verify that uploading a resume PDF does not throw errors and extracts tech/skills cleanly.

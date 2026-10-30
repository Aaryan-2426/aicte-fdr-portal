# AICTE Security Deposit & Fixed Deposit Receipt (FDR) Management Portal
**Smart India Hackathon / Problem Statement ID: 26265**  
**AICTE Regulation Bureau, Ministry of Education, Government of India**  
*Compliant with AICTE Approval Process Handbook (APH 2024–27)*

---

## 🌟 Overview
A centralized, tamper-evident digital regulatory platform for the All India Council for Technical Education (AICTE) to automate the lifecycle of institutional Fixed Deposit Receipts (FDRs) and Security Deposits required for regulatory approvals:
- **Joint Lien Surveillance:** Automatic tracking of FDR liens marked in favor of the *Member Secretary, AICTE*.
- **Core Banking System (CBS) Probing:** Automated verification against Finacle/BaNCS/Flexcube bank APIs.
- **Statutory 10-Year Lock-In Monitoring:** Automated countdown, interest dividend calculation, and regulatory compliance checks.
- **Multi-Role Stakeholder Gateway:**
  - AICTE Central Regulation Bureau (Executive monitoring, policy controls)
  - Regional Scrutiny Officers (Jurisdictional scrutiny, discrepancy flagging)
  - Technical Institutions / Principals (Digital submission, renewal filing, refund requests)
  - Scheduled Commercial Banks (Nodal verification, certificate issuance)
- **Legal & Regulatory Advisor:** AICTE APH regulatory intelligence with Google search grounding.

---

## 🚀 Quick Deployment Guide

### Option A: 1-Click Deploy on Render (Full-Stack Express + React)
1. Fork or push this repository to your GitHub account (`https://github.com/Aaryan-2426/aicte-fdr-portal`).
2. Go to [Render.com](https://render.com) and click **New > Web Service**.
3. Select your GitHub repository.
4. Render will automatically detect `render.yaml` or use these settings:
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Click **Deploy Web Service** to receive your permanent live URL (e.g. `https://aicte-fdr-portal.onrender.com`).

---

### Option B: Deploy on Vercel (Frontend & SPA)
1. Push this repository to GitHub (`https://github.com/Aaryan-2426/aicte-fdr-portal`).
2. Go to [Vercel.com](https://vercel.com) and click **Add New > Project**.
3. Import your repository.
4. Vercel automatically detects Vite settings from `vercel.json`:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **Deploy** to get your public `*.vercel.app` link.

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local full-stack server
npm run dev

# 3. Open in browser
http://localhost:3000
```

## 🧪 Testing

```bash
npm run build
npx tsx --test src/utils/fdrEngine.test.ts
npm run lint
```

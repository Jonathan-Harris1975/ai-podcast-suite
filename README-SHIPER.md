# AI Podcast Suite – Shiper Deployment Guide

This update package adds Shiper‑optimized Docker support.
Drop these files into the root of your project (same level as package.json).

## ⚙️ Deploy Steps

1. **Push or upload your repo to Shiper**
   - Make sure these files are at the repo root:
     - Dockerfile
     - entrypoint.js
     - .env.example
   - Your main app folder should include `package.json` and `services/`.

2. **Set Build Type → Dockerfile**
   - Go to **Settings → Build & Deploy → Build Type → Dockerfile**

3. **Set Environment Variables**
   - In Shiper → Variables:
     ```
     NODE_ENV=production
     PORT=8080
     ```
   - Optionally fill in the Cloudflare R2 and OpenRouter keys from `.env.example`.

4. **Deploy**
   - Shiper automatically detects the Dockerfile and builds:
     ```
     FROM node:20-slim
     EXPOSE 8080
     CMD ["node", "entrypoint.js"]
     ```
   - Once deployed, check logs for:
     ```
     🚀 AI Podcast Suite Unified Server Started
     ✅ Listening on port: 8080
     ```

## ✅ Health Check
- `GET /` → "AI Podcast Suite Online"
- `GET /health` → `{ ok: true }`
- RSS endpoints available at `/rss/...`

---

**Troubleshooting**
- If build fails immediately: confirm Build Type = Dockerfile
- If app shows “Offline”: check that `PORT` = 8080 in Variables
- To rebuild: trigger “Redeploy latest commit” from Shiper dashboard

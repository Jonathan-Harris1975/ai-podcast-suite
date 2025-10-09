# 🎧 AI Podcast & Newsletter Suite
**Version:** 2025.10.09

A modular Node.js stack that turns weekly AI news into a narrated podcast + newsletter.  
Sources are aggregated into a **newsletter RSS/JSON feed**, then orchestrated into a scripted episode with **OpenRouter (LLM)**, voiced with **Google Gemini 2.5 TTS**, artwork generated, and results stored in **Cloudflare R2**.

---

## 🚀 Deployment Quick Start
1. **Set environment variables** (see below).
2. **Deploy to Shiper** (Clear build cache → Manual Deploy).
3. **Trigger a full run**: `POST /api/podcast` → fetch weekly RSS topics → script → TTS → artwork → publish.

---

## 🔌 Environment
```bash
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_REGION=auto
R2_ACCESS_KEY_ID=<key>
R2_SECRET_ACCESS_KEY=<secret>

R2_BUCKET_RSS_FEEDS=rss-feeds
R2_BUCKET_RAW_TEXT=raw-text
R2_BUCKET_PODCAST=podcast
R2_BUCKET_META=podcast-meta
R2_BUCKET_RAW=podcast-chunks
R2_BUCKET_MERGED=podcast-merged

OPENROUTER_API_KEY=<your_openrouter_key>
# Optional:
OPENROUTER_MODEL_PRIMARY=gpt-4.1
OPENROUTER_MODEL_FALLBACK=claude-3-sonnet
OPENROUTER_TIMEOUT_MS=15000
PORT=3000
NODE_ENV=production

# 🎧 AI Podcast & Newsletter Suite

Clean, Shiper‑ready monorepo for an automated podcast + newsletter workflow.

- **RSS Feed** is a **standalone service** (for newsletter and for the podcast script to read from).
- Podcast orchestration flow is: **Script → TTS → Artwork** (triggered by a single endpoint).
- All environment variables are stored securely on **Shiper** for safety.

## 🧭 Top-level Endpoints (typical)
> Adjust paths to match your current routes.

- `POST /api/podcast` → Orchestrator (runs: Script → TTS → Artwork)
- `GET  /api/status` → Basic health/uptime JSON
- `GET  /health`      → Lightweight health probe

## 🧱 Architecture (text map)

```
Cloudflare R2 (buckets)
 ├─ rss-feeds
 ├─ raw-text
 ├─ podcast-chunks
 ├─ podcast-merged
 ├─ podcast
 └─ podcast-meta

Services
 ├─ rss-feed-creator  (standalone, fills rss-feeds for newsletter + script input)
 ├─ script            (reads RSS feed → generates weekly show script → raw-text)
 ├─ tts               (turns script into audio chunks → podcast-chunks/merged)
 └─ artwork           (episode cover → podcast-meta)
```

## 🔐 Environment

All sensitive env vars are configured in **Shiper** → *Settings → Variables*.  
This repo reads them at runtime via `process.env` only.

Core variables used across the suite:
```
R2_ENDPOINT
R2_REGION
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_RSS_FEEDS
R2_BUCKET_RAW_TEXT
R2_BUCKET_PODCAST
R2_BUCKET_META
R2_BUCKET_RAW
R2_BUCKET_MERGED
OPENROUTER_API_KEY
```

## 🧰 Shared Utilities

- `services/env-checker.js` → Hard-stop environment validator.
- `services/r2-client.js` → Unified Cloudflare R2 S3 client (no ping/retry).
- `services/s3client.js` → Alias for legacy imports.

## 🚀 Orchestrator

The orchestrator is a single **POST** endpoint (e.g. `/api/podcast`) that:
1. **Script**: reads the weekly RSS feed data → writes `raw-text` to R2.
2. **TTS**: turns the script into audio chunks / merged file(s).
3. **Artwork**: generates the cover image and stores metadata.

> **Note**: The **RSS feed creator is standalone** and can run on its own schedule.  
> The podcast orchestration reads the feed as an input but does not trigger the feed itself.

## 🛟 Fallbacks

- **OpenRouter** fallback is baked into the **script** and **rss-feed-creator** services to keep running through model outages.

## 🧪 Status

- `GET /api/status` responds with `{ status, version, uptime, environment, services }` for quick checks.
- `GET /health` is a minimal probe used by platforms/load balancers.

---

✨ Built for clean deployments on **Shiper** with unified logging and zero “ping” logic.

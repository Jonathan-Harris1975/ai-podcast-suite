# 🎧 AI Podcast Suite

**AI Podcast Suite** is a modular Node.js platform that automates the creation, processing, and publishing of AI-generated podcasts. It integrates **Google Gemini 2.5** for TTS, **Cloudflare R2** for object storage, and **OpenRouter** for LLM ops.

---

## 🚀 Features
- Modular services (TTS, RSS, metadata, orchestration).
- Cloudflare R2 for assets (text, chunks, merged MP3, RSS).
- Startup validation: env check + proper `HeadBucket` connectivity (no endpoint ping).
- `/health` for Shiper/Render probes.
- Plain logs (no color libraries).

---

## 🧩 Services Overview
| Service | Purpose |
|--------|---------|
| **rss-feed-creator** | Generates RSS (XML) and JSON feeds; uploads to R2. |
| **tts** | Text-to-Speech using **Google Gemini 2.5** voices. |
| **podcast** | Orchestration: generate → chunk → synthesize → merge → publish. |
| **meta** | Titles, descriptions, transcripts, summaries. |
| **server.js** | Main entry: validates env, checks R2 (HeadBucket), starts Express. |

---

## ☁️ Cloudflare R2 Setup

1. In Cloudflare R2 → **Create API Token** with access to your buckets.
2. Configure environment variables:

```bash
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_REGION=auto
R2_ACCESS_KEY_ID=<your_key>
R2_SECRET_ACCESS_KEY=<your_secret>
R2_BUCKET_RSS_FEEDS=rss-feeds
R2_BUCKET_RAW_TEXT=raw-text
R2_BUCKET_PODCAST=podcast
R2_BUCKET_META=podcast-meta
R2_BUCKET_RAW=podcast-chunks
R2_BUCKET_MERGED=podcast-merged
OPENROUTER_API_KEY=<your_openrouter_key>
PORT=3000

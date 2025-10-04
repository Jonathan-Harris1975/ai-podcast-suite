# 🎙️ AI-Enabled Podcast Script Generation

This project automates podcast script generation and orchestration using **Node.js**, **Hookdeck webhooks**, and **Cloudflare R2** for storage. It produces structured podcast scripts in phases (Intro → Main → Outro → Compose) and fans out to downstream repos for artwork and text-to-speech (TTS).

---

## 🚀 Flow Overview

1. **Start Script Generation**  
   - `POST /create-script`  
   - Body:  
     ```json
     {
       "sessionId": "TT-2025-09-28",
       "date": "2025-09-28"
     }
     ```  
   - This triggers Hookdeck, which delivers to `/intro`.

2. **Intro Phase (`/intro`)**  
   - Generates the intro monologue based on weather + persona.  
   - Stores `intro.txt` on persistent disk.  
   - Triggers `/main` via Hookdeck.

3. **Main Phase (`/main`)**  
   - Fetches articles from **`FEED_URL`**.  
   - Generates the main script with thematic flow.  
   - Stores `main.txt` (or chunks).  
   - Triggers `/outro` via Hookdeck.

4. **Outro Phase (`/outro`)**  
   - Generates outro monologue with CTA and book promo.  
   - Stores `outro.txt`.  
   - Triggers `/compose` via Hookdeck.

5. **Compose Phase (`/compose`)**  
   - Combines intro + main + outro.  
   - Formats + validates script.  
   - Uploads to R2 buckets:  
     - **Transcript** (`R2_BUCKET_TRANSCRIPTS`)  
     - **Chunks** (`R2_BUCKET_CHUNKS`)  
     - **Metadata** (`R2_META_BUCKET`)  
   - Generates title, description, SEO keywords, artwork prompt.  
   - Stores local metadata (`script-meta.json`).  
   - Triggers **wake-up webhook** → Hookdeck fans out to Artwork + TTS repos.

---

## 🗂️ File Storage

Each session is identified by `sessionId` (e.g., `TT-2025-09-28`).

### Persistent Disk (`/mnt/data/<sessionId>/`)
- `intro.txt`
- `main.txt`
- `outro.txt`
- `final-full-transcript.txt`
- `script-meta.json`

### Cloudflare R2 Buckets
- **Transcripts** → `R2_BUCKET_TRANSCRIPTS`  
  `https://transcripts.jonathan-harris.online/<sessionId>.txt`
- **Chunks** → `R2_BUCKET_CHUNKS`  
  `https://<chunks-domain>/<sessionId>/chunk-1.txt`
- **Metadata** → `R2_META_BUCKET`  
  ```
  https://<meta-domain>/<sessionId>-title.txt
  https://<meta-domain>/<sessionId>-description.txt
  https://<meta-domain>/<sessionId>-seokeywords.txt
  https://<meta-domain>/<sessionId>-artworkprompt.txt
  https://<meta-domain>/<sessionId>-meta.txt
  ```

---

## 🌐 Downstream Repos (via Hookdeck)

After `/compose`, the system sends a structured JSON payload to `HOOKDECK_WAKEUP_URL`. Hookdeck distributes it to **Artwork** and **TTS** repos.

### Example Payload
```json
{
  "sessionId": "TT-2025-09-28",
  "transcript": {
    "url": "https://transcripts.jonathan-harris.online/TT-2025-09-28.txt",
    "chunks": [
      "https://<chunks-domain>/TT-2025-09-28/chunk-1.txt",
      "https://<chunks-domain>/TT-2025-09-28/chunk-2.txt"
    ]
  },
  "meta": {
    "title": "AI in Healthcare: Breaking Barriers",
    "description": "Exploring how AI is reshaping...",
    "seoKeywords": "AI, healthcare, automation",
    "artworkPrompt": "A surrealist torch illuminating circuit boards",
    "full": "https://<meta-domain>/TT-2025-09-28-meta.txt"
  }
}
```

### Artwork Repo
Consumes:
- `sessionId`
- `meta.artworkPrompt`

### TTS Repo
Consumes:
- `sessionId`
- `transcript.url` or `transcript.chunks`

---

## ⚙️ Environment Variables

### Server
```ini
PORT=3000
FEED_URL=https://ai-news.jonathan-harris.online/feed.xml
```

### Hookdeck URLs
```ini
HOOKDECK_INTRO_URL=
HOOKDECK_MAIN_URL=
HOOKDECK_OUTRO_URL=
HOOKDECK_COMPOSE_URL=
HOOKDECK_WAKEUP_URL=
```

### Cloudflare R2
```ini
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_ACCESS_KEY=...
R2_SECRET_KEY=...

R2_BUCKET_TRANSCRIPTS=...
R2_BUCKET_CHUNKS=...
R2_META_BUCKET=...

R2_PUBLIC_BASE_URL_TRANSCRIPT=https://transcripts.jonathan-harris.online
R2_PUBLIC_BASE_URL_CHUNKS=https://<chunks-domain>
R2_PUBLIC_BASE_URL_META=https://<meta-domain>
```

---

## 🛠️ Endpoints

- `GET /health` → Service status  
- `POST /create-script` → Start new script generation  
- `POST /intro` → Generate intro (Hookdeck triggered)  
- `POST /main` → Generate main section (Hookdeck triggered)  
- `POST /outro` → Generate outro (Hookdeck triggered)  
- `POST /compose` → Combine, finalize, and upload assets (Hookdeck triggered)

---

## ✅ Deployment Notes
- Deploy to Render with persistent disk mounted at `/mnt/data`.  
- Ensure all env vars (Hookdeck + R2 + feed URL) are configured.  
- Hookdeck must be configured with sources and destinations:  
  - `create-script` → `/intro`  
  - `/intro` → `/main`  
  - `/main` → `/outro`  
  - `/outro` → `/compose`  
  - `/compose` → `HOOKDECK_WAKEUP_URL` → Artwork + TTS repos.  

# 🎨 Podcast Artwork Generator (src/ layout)

This service generates **podcast cover artwork** via OpenRouter and stores the PNG in **Cloudflare R2**.

## Endpoints

### `ALL /health`
Returns status JSON and (optionally) posts a wake message to `ART_CREATE` or `HOOKDECK_WAKEUP_URL`.

### `POST /generate`
Accepts either:

```json
{ "prompt": "AI in healthcare", "sessionId": "TT-2025-09-29" }
```
or
```json
{
  "sessionId": "TT-2025-09-29",
  "metaUrls": {
    "artworkPrompt": "https://pub-meta.r2.dev/TT-2025-09-29-artworkprompt.txt"
  }
}
```

**Response**
```json
{
  "success": true,
  "url": "https://pub-artwork.r2.dev/TT-2025-09-29.png",
  "sessionId": "TT-2025-09-29",
  "message": "Image generated and uploaded successfully"
}
```

## Environment Variables

See `.env.example`:

- `OPENROUTER_API_KEY` – OpenRouter API key
- `R2_BUCKET` – R2 bucket for artwork images
- `R2_PUBLIC_BASE_URL_ARTWORK` – Public base URL for artwork bucket
- `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY` – Cloudflare R2 credentials
- `ART_CREATE` / `HOOKDECK_WAKEUP_URL` – Optional downstream webhooks

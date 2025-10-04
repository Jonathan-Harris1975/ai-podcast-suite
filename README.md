# AI Podcast Suite (Orchestrator)

Orchestrates: Script → Artwork → TTS (three retries each).
Returns 200 immediately from `/start/:sessionId`.

## Endpoints
- `GET /health`
- `POST /start/:sessionId`
- `POST /clean-temp/:sessionId`

## Environment
See `.env.example`. No secrets stored here.

## Deploy
Single Dockerfile at root.

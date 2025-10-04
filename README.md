# AI Podcast Suite (Mono Service)

**Endpoints**
- `GET /health`
- `POST /start?sessionid={id}`  (non-blocking)
- `POST /clean-temp?sessionid={id}` (local temp only; no R2)

**Webhooks**
- Optional verification when `WEBHOOKS_ENABLED=true` and `HOOKDECK_WEBHOOK_SECRET` set.
- Header: `x-hookdeck-signature` (HMAC SHA256 base64 of raw body).

**Env**
See `.env.example`. The service exits if required variables are missing.

**Run**
- Dockerfile provided (Node 22 Alpine)
- Exposes `PORT` (default 3000)

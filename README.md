# AI Podcast Suite

Unified, modular Node.js monorepo configured for **Koyeb** with a **single Docker image** that can run any service via `SERVICE_NAME`.
This README is intentionally neutral and deployment-focused.

## Services

- **Main Service** (`SERVICE_NAME=main`) — Orchestrator and API.
- **RSS Feed Creator** (`SERVICE_NAME=rss-feed-creator`) — Builds/serves the RSS feed.

All services use the same **`PORT`** environment variable (default `3000`).

## Endpoints

### Main Service
| Method | Path | Source |
|---|---|---|
| `GET` | `/` | `health.js` |
| `POST` | `/` | `cleaner.js` |
| `POST` | `/start/:sessionId` | `startProcess.js` |

### RSS Feed Creator
_All endpoints are mounted under `/api` within the service._
| Method | Path | Source |
|---|---|---|
| `GET` | `/` | `rss.js` |
| `POST` | `/rewrite` | `rewrite.js` |

**Health:**
- Main: `GET /health`
- RSS Feed Creator: `GET /health`

## Deployment on Koyeb

This repo ships with a single root **Dockerfile** and a unified **koyeb.yaml**.
Both services are deployed from the **same image**; select which one to run by setting `SERVICE_NAME`.

- Build context: `.`
- `SERVICE_NAME`: `main` _or_ `rss-feed-creator`
- `PORT`: shared by all services (default `3000`)

### `koyeb.yaml` Summary
- `ai-podcast-suite`: `SERVICE_NAME=main`, `PORT=3000`, route `/`
- `rss-feed-creator`: `SERVICE_NAME=rss-feed-creator`, `PORT=3000`, route `/rss`

> Tip: Configure all required secrets in Koyeb (R2 credentials, OpenRouter keys, etc.). Missing envs will be logged on boot.

# AI Podcast Suite (Koyeb-Stable)

Unified Node.js monorepo: **Main AI Podcast Service** + **RSS Feed Creator** under one container, one port (8080).

## Routes

### Main Service (mounted at `/`)
| Method | Path | File |
|---|---|---|
| `GET` | `/` | `health.js` |
| `POST` | `/` | `cleaner.js` |
| `POST` | `/start/:sessionId` | `startProcess.js` |

### RSS Feed Creator (mounted at `/rss`)
| Method | Path | File |
|---|---|---|
| `GET` | `/` | `rss.js` |
| `POST` | `/rewrite` | `rewrite.js` |

**Health:**
- `GET /` → "AI Podcast Suite Online"
- `GET /health` → `{ ok: true }`

## Deploy to Koyeb

- Koyeb auto-detects the Dockerfile
- Exposes `PORT=8080`
- Configure environment variables from `.env.example`
- Single service runs both apps (no extra YAML needed)

## Notes
- Removed service-level Dockerfiles/YAMLs and root `koyeb.yaml`.
- Both apps remain modular; mounted together for a single exposed HTTP port.

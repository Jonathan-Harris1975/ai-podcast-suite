# 🎙️ AI Podcast Suite

Unified multi-service Node.js platform powering the **Turing Torch AI Podcast**, built by Jonathan Harris.

## 🧩 Services & Endpoints

### 🧠 Main Service (Port 3000)
| Endpoint | Description |
|-----------|--------------|
| `/health` | System health check |
| `/start` | Begin main podcast script pipeline |
| `/clean` | Clean cache or session data |
| `/api/rewrite` | Rewrite fetched articles |
| `/api/rss` | Serve compiled podcast feed |

### 📰 RSS Feed Creator (Port 9200)
| Endpoint | Description |
|-----------|--------------|
| `/health` | Health check |
| `/api/rss` | Fetch and serve the generated RSS XML feed |
| `/api/rewrite` | Trigger rewrite and regeneration pipeline |
| `/api/rss/generate` | Manually trigger RSS generation |
| `/data/rss.xml` | Fetch raw RSS XML file (if hosted) |

### ⚙️ Deployment Notes
- Single Docker image for all services.
- `SERVICE_NAME` env var selects which service runs in container:
  - `main` → runs primary AI Podcast Suite
  - `rss-feed-creator` → runs RSS generator microservice

### ☁️ Koyeb Deployment
Two apps defined in `koyeb.yaml`, both using this unified Dockerfile.

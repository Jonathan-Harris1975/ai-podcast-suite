# AI Podcast Suite

## Version: v2025.10.10-Final

### 🚀 Deployment (Shiper / Dockerfile-only)
```bash
pnpm install
pnpm start
```

### 🌐 Environment Variables
| Key | Description |
|-----|--------------|
| R2_ENDPOINT | Cloudflare R2 endpoint URL |
| R2_REGION | Cloudflare R2 region |
| R2_ACCESS_KEY_ID | Access key |
| R2_SECRET_ACCESS_KEY | Secret key |
| R2_BUCKET_ARTWORK | Bucket for artwork |
| R2_BUCKET_META | Bucket for meta |
| R2_BUCKET_PODCAST | Bucket for merged podcasts |
| R2_BUCKET_RAW_TEXT | Bucket for raw text |
| R2_BUCKET_RSS_FEEDS | Bucket for RSS feeds |
| OPENROUTER_API_KEY | API key for OpenRouter |

### Endpoints
- `GET /health` → `{ status: "ok", uptime }`
- `GET /api/status` → service + version info

### Notes
- Startup performs env + R2 checks **leniently** and never blocks boot.
- Emoji logs enabled for human-readable Shiper output.

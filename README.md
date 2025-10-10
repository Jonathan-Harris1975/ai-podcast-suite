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

## ⚙️ Automated Release Workflow
Run the following command from the project root:
```bash
pnpm run build:release
```
This will validate imports & env, verify R2, generate checksums, produce a ship-ready zip, and (if in a git repo) commit + tag the release.

### 🔒 Integrity
**Archive Name:** ai-podcast-suite-shiper-ready.zip  
**Build Version:** v2025.10.10-Final  
**Archive SHA-256:** (to be filled after build)

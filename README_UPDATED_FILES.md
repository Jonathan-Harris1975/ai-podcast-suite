# AI Podcast Suite — Updated Files (RSS Feed Creator)

This zip contains ONLY the updated/live files you asked for.

## Included
- `services/rss-feed-creator/rewrite-pipeline.js` — main pipeline with Short.io branding, title/description split, feed limits, R2 bootstrap.
- `services/rss-feed-creator/build-rss.js` — writes RSS XML via `putText` to R2 public bucket.
- `services/rss-feed-creator/bootstrap.js` — copies local `/data/feeds.txt` and `/data/urls.txt` into R2 if missing, creates cursor.
- `services/rss-feed-creator/utils/rss-prompts.js` — reinforced Gen‑X British prompt.
- `services/rss-feed-creator/utils/models.js` — uses central `services/shared/utils/ai-service.js` and route model `rss.rewrite`.
- `services/rss-feed-creator/utils/shortio.js` — branded link shortener with graceful fallback.
- `routes/rewrite.js` — route to trigger the pipeline `POST /api/rewrite/run` and a health `GET /api/rewrite`.

## Assumptions
- Central utilities live under `services/shared/utils/`:
  - `logger.js` exporting `{ info, warn, error }`
  - `r2-client.js` exporting `{ getObject, putJson, putText }`
  - `ai-service.js` exporting `{ callAI(routeName, payload) }`
- Env expected:
  - `R2_BUCKET_RSS_FEEDS`, `R2_PUBLIC_BASE_URL_RSS`, optionally `MAX_ITEMS_PER_FEED`, `MAX_FEEDS_PER_RUN`.
  - `SHORTIO_API_KEY`, `SHORTIO_DOMAIN` for branded links.

## Endpoint
- `POST /api/rewrite/run` — runs the pipeline and builds RSS.

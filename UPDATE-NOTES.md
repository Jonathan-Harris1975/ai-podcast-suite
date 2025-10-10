# AI Podcast Suite – Update bundle
Date: 2025-10-10T08:19:07.215030Z

This zip contains only the updated files you need to drop into your existing repo:

- server.js — fire-and-forget /api/rewrite calling services/rss-feed-creator/services/rewrite-pipeline.js
- services/rss-feed-creator/index.js — wrapper exporting startFeedCreator()
- services/shared/utils/r2-client.js — unified R2 client using R2_ENDPOINT (or R2_S3_ENDPOINT)

Env required:
R2_BUCKET_RSS_FEEDS, R2_PUBLIC_BASE_URL_RSS, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_REGION

Dockerfile and the rest remain untouched.

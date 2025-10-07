AI Podcast Suite – Shiper Final Fix
===================================

This patch ensures a clean build and correct ESM imports for both services.

✅ Fixes included:
- entrypoint.js uses dynamic imports (no static import errors)
- server.js & RSS Feed Creator use .js extensions in route imports
- Both services export app instead of starting their own listeners
- Dockerfile copies all required folders and forces cache invalidation

Deployment Steps:
-----------------
1️⃣ Replace the existing Dockerfile, server.js, entrypoint.js,
    and services/rss-feed-creator/index.js with these files.
2️⃣ Commit and push to your GitHub repo.
3️⃣ In Shiper:
     → Click "New Deployment" → "Deploy from latest commit"
     (do NOT redeploy old build).
4️⃣ Wait for the new build to complete.

Expected Logs:
---------------
✅ Loaded main service module: [ 'default' ]
✅ Loaded RSS service module: [ 'default' ]
🧠 Main Service mounted at: /
📰 RSS Feed Creator mounted at: /rss
🚀 AI Podcast Suite Unified Server Started
✅ Listening on port: 8080

AI Podcast Suite – Clean Final (Readable Logs + Self-Contained)
---------------------------------------------------------------
- Human-readable colored logs (no external deps)
- Dynamic entrypoint; single port (8080)
- RSS service standalone under /rss
- /api/rewrite uses local pipeline (dynamic import from common locations)

Deploy:
1) Copy these files into your repo (keep paths).
2) Commit & push.
3) Shiper → New Deployment → Deploy from latest commit.

Env:
PORT=8080
LOG_LEVEL=debug

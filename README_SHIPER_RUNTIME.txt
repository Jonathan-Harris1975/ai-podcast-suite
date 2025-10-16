AI Podcast Suite — Shiper Runtime Diagnostic Dockerfile
==============================================================
This final diagnostic build ensures the container always stays alive after
startup, allowing Shiper logs to stream continuously for debugging.

What it does:
--------------
1️⃣ Prints container startup diagnostics (date, Node version, working directory, file list)
2️⃣ Runs startupCheck.mjs to perform full environment validation
3️⃣ Keeps the container alive with `tail -f /dev/null` for real-time log viewing

Usage:
------
1. Place this Dockerfile at your repository root (same level as package.json)
2. In Shiper Dashboard → Build & Deploy → Runtime Configuration:
   • Mode: Web
   • Exposed Port: 3000
   • Start Command: (leave blank)
3. Redeploy your service

Expected Shiper Logs:
---------------------
✅ Dockerfile build finished successfully
🚀 Container runtime started at: Wed Oct 16 01:30:00 UTC 2025
📦 Node Version: v22.x
📁 Listing /app contents:
...
🧩 Launching startupCheck.mjs...
...
💤 Keeping container alive for Shiper logs...

If you see no logs, Shiper is not yet running the runtime container.

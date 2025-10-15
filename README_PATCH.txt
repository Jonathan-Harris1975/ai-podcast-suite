AI Podcast Suite — Patch Instructions (No Webhooks, Global Env Checker, Health Check)
====================================================================================

This patch adds:
  • /bootstrap/envBootstrap.js – global environment validator + startup health check
  • /shared/utils/envChecker.js – reusable env validation helper
  • /shared/utils/logger.js – zero-dependency logger with LOG_LEVEL support
  • Patched /services/tts/utils/ttsProcessor.js – fixes payload + uses global env check

How to apply:
1) Copy the folders from this zip into your repo root, preserving paths.
2) At the VERY TOP of your main entry file (server.js, index.js, or app.js), add:
     import "./bootstrap/envBootstrap.js";

3) Ensure your runtime provides the required environment variables (see envBootstrap.js lists).

Notes:
- No webhooks required. All webhook variables were removed from validation.
- Logger honors LOG_LEVEL = error | warn | info | debug
- Bootstrap prints a health summary and warns if free memory < 0.5 GB or CPU cores < 2.
- ttsProcessor now uses R2_BUCKETS.RAW and a corrected Gemini TTS payload.

If you also want me to patch other service files to import envBootstrap on load, repeat step (2)
in those entry points as needed.
Logger & Env Import Cleanup — Repo-wide Codemod
===============================================

What this patch gives you:
  • /utils/logger.js — Plain text logger (emojis first), LOG_LEVEL-aware.
  • /utils/envChecker.js — Global env validator.
  • /scripts/fix-logger-and-env-imports.mjs — Codemod to repair ALL files.

How to apply:
1) Unzip these files at your repo root (/app).
2) Commit /utils/* and /scripts/*.
3) Run the codemod locally or in your container:
     node ./scripts/fix-logger-and-env-imports.mjs
4) Verify changes in git diff; then redeploy.

What it fixes:
  • Rewrites any `import { info, error, warn, debug } from ".../logger.js"`
    → `import { log } from ".../logger.js"`
  • Converts `info(` → `log.info(` (and similarly for error/warn/debug), safely.
  • Normalizes any lingering paths from `shared/utils/*` → `utils/*`.
  • Ensures `log.*` is imported when used.

Notes:
  • No colors in logs; emoji-first labels as requested.
  • If you have custom logger wrappers, re-run codemod after excluding those files.
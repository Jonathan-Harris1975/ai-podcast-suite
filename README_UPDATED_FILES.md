# Change Log — AI Podcast Suite (Production Prep)

- **services/artwork/routes/index.js** — Rewrite as router aggregator; remove wrong import & Hookdeck traces
- **services/tts/routes/edit.js** — Remove Hookdeck webhook call
- **services/tts/utils/webhooks.js** — Add generic webhook helper without Hookdeck
- **services/script/utils/script-helper.js** — Remove Hookdeck mentions from comments
- **services/script/routes/intro.js** — Remove HOOKDECK_* env chaining from storeAndTrigger
- **services/script/routes/main.js** — Remove HOOKDECK_* env chaining from storeAndTrigger
- **services/script/routes/outro.js** — Remove HOOKDECK_* env chaining from storeAndTrigger
- **services/script/routes/compose.js** — Remove wakeup webhook block; no Hookdeck
- **services/artwork/routes/health.js** — Remove Hookdeck mention in comments
- **server.js** — Fix final log call to use info()
- **package.json** — Pin wildcard deps, remove built-ins, move supertest to devDeps, bound engines

## Notes
- Removed all Hookdeck-specific calls and envs from code.
- Introduced generic optional webhooks for chaining where needed.
- Fixed incorrect artwork routes index to aggregate subroutes.
- Added missing `services/tts/utils/webhooks.js`.
- Corrected logging call in `server.js`.
- Pinned risky wildcard dependencies and removed built-ins from `dependencies`.
- Target Node.js `>=22 <25`. Use Dockerfile based on `node:22-slim`.

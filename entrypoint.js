// entrypoint.js
import app from "./server.js";
import { bootstrapR2 } from "./services/bootstrap.js";

/**
 * Bootstraps the environment, seeds or syncs R2 data if necessary,
 * and then starts the unified podcast server.
 */
(async () => {
  try {
    console.log("🧩 Initializing system bootstrap...");
    await bootstrapR2();
  } catch (err) {
    console.error("❌ Bootstrap failed:", err);
  }

  const PORT = process.env.PORT || 8080;

  app.listen(PORT, () => {
    console.log("===========================================");
    console.log("🚀 AI Podcast Suite Unified Server Started");
    console.log(`✅ Listening on port: ${PORT}`);
    console.log("===========================================");
  });
})();

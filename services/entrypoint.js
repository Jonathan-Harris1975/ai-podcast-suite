// entrypoint.js
import app from "./server.js";
import { validateEnv } from "./utils/validateEnv.js";
import { bootstrapR2 } from "./services/bootstrap.js";

(async () => {
  try {
    validateEnv();           // 🚨 Hard fail if any env missing
    await bootstrapR2();     // ☁️ Sync local data -> R2
  } catch (err) {
    console.error("❌ Bootstrap or env validation failed:", err);
    process.exit(1);
  }

  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log("===========================================");
    console.log("🚀 AI Podcast Suite Unified Server Started");
    console.log(`✅ Listening on port: ${PORT}`);
    console.log("===========================================");
  });
})();

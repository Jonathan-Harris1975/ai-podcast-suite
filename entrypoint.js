// entrypoint.js
import app from "./server.js";
import { bootstrapR2 } from "./services/bootstrap.js";

(async () => {
  try {
    // Run bootstrap before server starts
    await bootstrapR2();
  } catch (err) {
    console.error("❌ R2 bootstrap failed:", err);
  }

  const PORT = process.env.PORT || 8080;

  app.listen(PORT, () => {
    console.log("===========================================");
    console.log("🚀 AI Podcast Suite Unified Server Started");
    console.log(`✅ Listening on port: ${PORT}`);
    console.log("===========================================");
  });
})();

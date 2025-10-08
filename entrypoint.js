// entrypoint.js
import app from "./server.js";
import { bootstrapR2 } from "./services/bootstrap.js";

(async () => {
  try {
    await bootstrapR2(); // make sure feeds.txt, urls.txt, cursor.json are good in R2
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

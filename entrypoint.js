// entrypoint.js
import app from "./server.js";
import { bootstrapR2 } from "./services/bootstrap.js";

(async () => {
  try {
    await bootstrapR2(); // 🔥 ensures feeds.txt, urls.txt, cursor.json exist in R2
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
})();  log.warn("⚠️ Main service not mountable (likely self-listening).");
}

if (looksLikeExpress(rssApp)) {
  app.use("/rss", rssApp);
  log.info("📰 RSS Feed Creator mounted at: /rss");
} else {
  log.warn("⚠️ RSS Feed Creator not mountable (likely self-listening).");
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  log.info("===========================================");
  log.info("🚀 AI Podcast Suite Unified Server Started");
  log.info(`✅ Listening on port: ${PORT}`);
  log.info("===========================================");
});

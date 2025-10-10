// ---- RSS FEED CREATOR ----
async function startRssFeedCreator() {
  log("🧩 Attempting to initialize RSS Feed Creator...");
  try {
    const mod = await import("./services/rss-feed-creator/index.js");
    const fn = mod.default || mod.startFeedCreator;
    if (typeof fn === "function") {
      await fn();
      log("📰 RSS Feed Creator initialized successfully.");
    } else {
      log("⚠️ RSS Feed Creator loaded but no start function was exported.");
    }
  } catch (err) {
    log("❌ RSS Feed Creator failed to initialize.", { error: err.message });
  }
}

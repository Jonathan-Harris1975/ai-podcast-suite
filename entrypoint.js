// entrypoint.js
import express from "express";
import { log } from "./utils/logger.js";

const app = express();

app.get("/", (_, res) => res.send("AI Podcast Suite Online"));
app.get("/health", (_, res) => res.json({ ok: true }));

let mainApp;
let rssApp;

try {
  const mod = await import("./server.js");
  mainApp = mod.default || mod.app || mod.router || mod;
  log.info(`✅ Loaded main service module keys: ${Object.keys(mod).join(",")}`);
} catch (err) {
  log.error(`❌ Failed to import main service: ${err.message}`);
}

try {
  const mod = await import("./services/rss-feed-creator/index.js");
  rssApp = mod.default || mod.app || mod.router || mod;
  log.info(`✅ Loaded RSS service module keys: ${Object.keys(mod).join(",")}`);
} catch (err) {
  log.error(`❌ Failed to import RSS service: ${err.message}`);
}

function looksLikeExpress(a) {
  return a && (typeof a.use === "function" || typeof a.handle === "function");
}

if (looksLikeExpress(mainApp)) {
  app.use("/", mainApp);
  log.info("🧠 Main Service mounted at: /");
} else {
  log.warn("⚠️ Main service not mountable (likely self-listening).");
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

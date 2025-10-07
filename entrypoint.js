// entrypoint.js
import express from "express";

const app = express();

app.get("/", (_, res) => res.send("AI Podcast Suite Online"));
app.get("/health", (_, res) => res.json({ ok: true }));

let mainApp;
let rssApp;

// Dynamic imports for ESM/CommonJS compatibility
try {
  const mod = await import("./server.js");
  mainApp = mod.default || mod.app || mod.router || mod;
  console.log("✅ Loaded main service module:", Object.keys(mod));
} catch (err) {
  console.error("❌ Failed to import main service:", err.message);
}

try {
  const mod = await import("./services/rss-feed-creator/index.js");
  rssApp = mod.default || mod.app || mod.router || mod;
  console.log("✅ Loaded RSS service module:", Object.keys(mod));
} catch (err) {
  console.error("❌ Failed to import RSS service:", err.message);
}

function looksLikeExpress(a) {
  return a && (typeof a.use === "function" || typeof a.handle === "function");
}

if (looksLikeExpress(mainApp)) {
  app.use("/", mainApp);
  console.log("🧠 Main Service mounted at: /");
} else {
  console.warn("⚠️ Main service not mountable (likely self-listening).");
}

if (looksLikeExpress(rssApp)) {
  app.use("/rss", rssApp);
  console.log("📰 RSS Feed Creator mounted at: /rss");
} else {
  console.warn("⚠️ RSS Feed Creator not mountable (likely self-listening).");
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("===========================================");
  console.log("🚀 AI Podcast Suite Unified Server Started");
  console.log(`✅ Listening on port: ${PORT}`);
  console.log("===========================================");
});

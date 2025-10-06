// entrypoint.js
import express from "express";

let mainApp;
let rssApp;

try {
  const mod = await import("./server.js");
  mainApp = mod.default || mod.app || mod.router || mod;
} catch (err) {
  console.error("⚠️ Could not import main app from server.js:", err?.message);
}

try {
  const mod = await import("./services/rss-feed-creator/index.js");
  rssApp = mod.default || mod.app || mod.router || mod;
} catch (err) {
  console.error("⚠️ Could not import RSS app:", err?.message);
}

const app = express();

app.get("/", (_, res) => res.send("AI Podcast Suite Online"));
app.get("/health", (_, res) => res.json({ ok: true }));

function looksLikeExpress(a) { return a && (typeof a.use === "function" || typeof a.handle === "function"); }

if (looksLikeExpress(mainApp)) { app.use("/", mainApp); console.log("🧠 Main Service mounted at: /"); }
else { console.log("🧠 Main Service not mountable (likely self-listening)."); }

if (looksLikeExpress(rssApp)) { app.use("/rss", rssApp); console.log("📰 RSS Feed Creator mounted at: /rss"); }
else { console.log("📰 RSS Feed Creator not mountable (likely self-listening)."); }

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("===========================================");
  console.log("🚀 AI Podcast Suite Unified Server Started");
  console.log(`✅ Listening on port:            ${PORT}`);
  console.log("===========================================");
});

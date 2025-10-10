// AI Podcast Suite Server – Shiper Optimized v2025.10.10-RSS
// Stable for always-on /health pings, JSON logging, and auto-started RSS Feed Creator

import express from "express";
import process from "node:process";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERSION = "2025.10.10-RSS";
const NODE_ENV = process.env.NODE_ENV || "production";

// ---- LOGGING (instant flush to stdout for Shiper) ----
function log(message, data = null) {
  const line =
    `[${new Date().toISOString()}] ${message}` +
    (data ? " " + JSON.stringify(data) : "");
  process.stdout.write(line + "\n");
}

// ---- HEALTH ----
app.get("/health", (req, res) => {
  log("🩺 Health check hit!");
  res.status(200).json({
    status: "ok",
    uptime: Math.round(process.uptime()) + "s",
    version: VERSION,
    environment: NODE_ENV
  });
});

// ---- REWRITE ----
app.post("/api/rewrite", (req, res) => {
  log("✏️ Rewrite endpoint hit!");
  const text = req.body?.text || "";
  const rewritten = text.replace(/\n+/g, " ").replace(/\s{2,}/g, " ").trim();
  res.json({ success: true, rewritten });
});

// ---- PODCAST ----
app.post("/api/podcast", (req, res) => {
  const script = req.body?.script || "";
  const voice = req.body?.voice || "default";
  log("🎙️ Podcast endpoint hit!", { chars: script.length, voice });
  res.json({
    success: true,
    message: "Podcast request received",
    chars: script.length,
    voice
  });
});

// ---- RSS FEED CREATOR AUTO-START ----
async function tryStartRSSFeedCreator() {
  try {
    log("🧩 Attempting to initialize RSS Feed Creator...");
    const mod = await import("./services/rss-feed-creator/index.js").catch(() => null);

    if (!mod) {
      log("⚠️ RSS Feed Creator module not found at ./services/rss-feed-creator/index.js");
      return;
    }

    if (typeof mod.default === "function") {
      await mod.default();
      log("📰 RSS Feed Creator initialized successfully (default export).");
    } else if (typeof mod.startFeedCreator === "function") {
      await mod.startFeedCreator();
      log("📰 RSS Feed Creator started successfully (named export).");
    } else {
      log("⚠️ RSS Feed Creator loaded but has no valid start function.");
    }
  } catch (err) {
    log("❌ RSS Feed Creator failed to start:", { error: err.message });
  }
}

// ---- SERVER STARTUP ----
app.listen(PORT, async () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
  await tryStartRSSFeedCreator();
});

// ---- HEARTBEAT LOG (every 5 min) ----
setInterval(() => {
  log(`⏱️ Heartbeat: uptime ${Math.round(process.uptime())}s`);
}, 5 * 60 * 1000);

// ---- CLEAN EXIT HANDLING ----
process.on("SIGTERM", () => {
  log("🛑 Received SIGTERM. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  log("🛑 Received SIGINT. Shutting down gracefully...");
  process.exit(0);
});

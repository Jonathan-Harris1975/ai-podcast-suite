// AI Podcast Suite Server — Shiper Optimized v2025.10.10
// Stable for always-on /health pings + JSON logging + RSS Feed Creator autoload

import express from "express";
import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERSION = "2025.10.10";
const NODE_ENV = process.env.NODE_ENV || "production";

// ---- LOGGING (instant flush to stdout for Shiper) ----
function log(message, data = null) {
  const line = JSON.stringify({
    time: new Date().toISOString(),
    message,
    ...(data || {})
  });
  process.stdout.write(line + "\n");
}

// ---- HEALTH ENDPOINT ----
app.get("/health", (req, res) => {
  log("🩺 Health check hit!");
  res.status(200).json({
    status: "ok",
    uptime: `${Math.round(process.uptime())}s`,
    version: VERSION,
    environment: NODE_ENV
  });
});

// ---- REWRITE ENDPOINT ----
app.post("/api/rewrite", (req, res) => {
  log("✏️ Rewrite endpoint hit!");
  const text = req.body?.text || "";
  const rewritten = text.replace(/\n+/g, " ").replace(/\s{2,}/g, " ").trim();
  res.json({ success: true, rewritten });
});

// ---- PODCAST ENDPOINT ----
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

// ---- RSS FEED CREATOR (absolute import for Shiper) ----
async function startRssFeedCreator() {
  log("🧩 Attempting to initialize RSS Feed Creator...");

  try {
    // Force absolute path resolution relative to this file
    const rssPath = path.resolve(__dirname, "services/rss-feed-creator/index.js");

    if (!fs.existsSync(rssPath)) {
      log("⚠️ RSS Feed Creator file not found at expected absolute path.", { path: rssPath });
      return;
    }

    const mod = await import(pathToFileURL(rssPath).href);
    const fn = mod.default || mod.startFeedCreator;

    if (typeof fn === "function") {
      await fn();
      log("📰 RSS Feed Creator initialized successfully.", { path: rssPath });
    } else {
      log("⚠️ RSS Feed Creator loaded but no start function was exported.", { path: rssPath });
    }
  } catch (err) {
    log("❌ RSS Feed Creator failed to initialize.", { error: err.message });
  }
}

// ---- STARTUP ----
app.listen(PORT, async () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
  await startRssFeedCreator(); // Try to boot the RSS service automatically
});

// ---- HEARTBEAT LOG (every 5 minutes) ----
setInterval(() => {
  log(`⏱️ Heartbeat: uptime ${Math.round(process.uptime())}s`);
}, 5 * 60 * 1000);

// ---- CLEAN EXIT HANDLERS ----
process.on("SIGTERM", () => { log("🛑 SIGTERM – exiting"); process.exit(0); });
process.on("SIGINT",  () => { log("🛑 SIGINT – exiting");  process.exit(0); });

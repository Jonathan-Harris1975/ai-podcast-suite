// AI Podcast Suite Server – Shiper Optimized v2025.10.10-FINAL
// /health + /api/rewrite + /api/podcast + /api/rss-feed (fire & forget)

import express from "express";
import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERSION = "2025.10.10-FINAL";
const NODE_ENV = process.env.NODE_ENV || "Production";

// --- LOGGER (JSON + emoji, instant flush) ---
const log = (emoji, message, meta = {}) => {
  const entry = {
    time: new Date().toISOString(),
    message: `${emoji} ${message}`,
    ...(Object.keys(meta).length ? { meta } : {})
  };
  process.stdout.write(JSON.stringify(entry) + "\n");
};

// --- HEALTH ---
app.get("/health", (req, res) => {
  log("🩺", "Health check hit");
  res.json({
    status: "ok",
    version: VERSION,
    uptime: Math.round(process.uptime()) + "s",
    environment: NODE_ENV
  });
});

// --- REWRITE ---
app.post("/api/rewrite", (req, res) => {
  const text = req.body?.text || "";
  const rewritten = text.replace(/\n+/g, " ").replace(/\s{2,}/g, " ").trim();
  log("✏️", "Rewrite endpoint hit", { chars: text.length });
  res.json({ success: true, rewritten });
});

// --- PODCAST ---
app.post("/api/podcast", (req, res) => {
  const script = req.body?.script || "";
  const voice = req.body?.voice || "default";
  log("🎙️", "Podcast endpoint hit", { chars: script.length, voice });
  res.json({
    success: true,
    message: "Podcast request received",
    chars: script.length,
    voice
  });
});

// --- RSS FEED CREATOR (Fire & Forget) ---
app.post("/api/rss-feed", (req, res) => {
  log("🧩", "RSS Feed Creator triggered (fire-and-forget)");
  setImmediate(async () => {
    try {
      const rssPath = path.resolve("services/rss-feed-creator/index.js");
      const mod = await import(pathToFileURL(rssPath).href);
      const fn = mod.default || mod.startFeedCreator;
      if (typeof fn === "function") {
        await fn();
        log("📰", "RSS Feed Creator initialized successfully");
      } else {
        log("⚠️", "RSS Feed Creator found but missing entry function");
      }
    } catch (err) {
      log("❌", "RSS Feed Creator failed", { error: err.message });
    }
  });
  res.json({ success: true, message: "RSS Feed Creator started in background" });
});

// --- START SERVER ---
app.listen(PORT, () => log("🚀", `Server running on port ${PORT} (${NODE_ENV})`));

// --- HEARTBEAT (every 5 min) ---
setInterval(() => log("⏱️", `Heartbeat: uptime ${Math.round(process.uptime())}s`), 300000);

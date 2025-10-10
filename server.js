// AI Podcast Suite Server – Shiper Optimized v2025.10.10-FINAL
// /health + /api/rewrite (fire & forget RSS) + /api/podcast
import express from "express";
import process from "node:process";
import path from "node:path";
import { pathToFileURL } from "node:url";

// --- LOGGER: emoji-first JSON, instant flush ---
const log = (emoji, message, meta = null) => {
  const entry = { emoji, time: new Date().toISOString(), message };
  if (meta && Object.keys(meta).length) entry.meta = meta;
  process.stdout.write(JSON.stringify(entry) + "\n");
};

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERSION = "2025.10.10-FINAL";
const NODE_ENV = process.env.NODE_ENV || "Production";

// --- Bootstrap core (env + R2 presence checks, no pings) ---
import "./services/bootstrap.js";

// --- HEALTH ---
app.get("/health", (req, res) => {
  log("🩺", "Health check hit");
  res.status(200).json({
    status: "ok",
    version: VERSION,
    uptime: Math.round(process.uptime()) + "s",
    environment: NODE_ENV
  });
});

// --- REWRITE (also triggers RSS Feed Creator in background) ---
app.post("/api/rewrite", (req, res) => {
  const text = (req.body?.text ?? "").toString();
  const rewritten = text.replace(/\n+/g, " ").replace(/\s{2,}/g, " ").trim();
  log("✏️", "/api/rewrite hit (RSS trigger)", { chars: text.length });

  // Fire-and-forget RSS generator
  setImmediate(async () => {
    try {
      const rssPath = path.resolve("services/rss-feed-creator/bootstrap.js");
      const mod = await import(pathToFileURL(rssPath).href);
      const fn = mod.default || mod.startFeedCreator;
      if (typeof fn === "function") {
        await fn();
        log("📰", "RSS Feed Creator completed successfully");
      } else {
        log("⚠️", "RSS Feed Creator module loaded but no entry function");
      }
    } catch (err) {
      log("❌", "RSS Feed Creator failed", { error: err?.message || String(err) });
    }
  });

  res.json({ success: true, rewritten, triggered: "rss-feed" });
});

// --- PODCAST (stub; podcast remains separate package) ---
app.post("/api/podcast", (req, res) => {
  const script = (req.body?.script ?? "").toString();
  const voice = req.body?.voice || "default";
  log("🎙️", "Podcast endpoint hit", { chars: script.length, voice });
  res.json({ success: true, message: "Podcast request received", chars: script.length, voice });
});

// --- START SERVER ---
app.listen(PORT, () => log("🚀", `Server running on port ${PORT} (${NODE_ENV})`));

// --- HEARTBEAT every 30 minutes ---
setInterval(() => {
  log("⏱️", `Heartbeat: uptime ${Math.round(process.uptime())}s`);
}, 30 * 60 * 1000);

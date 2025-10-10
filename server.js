// AI Podcast Suite Server — FixC (2025.10.10)
// ✅ Proper route imports
// ✅ Reliable logging
// ✅ Working /health, /api/rewrite, /api/podcast
// ✅ 30-minute heartbeat

import express from "express";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";
const VERSION = "2025.10.10-FixC";

// ---------- LOGGING ----------
function log(message, meta) {
  const entry = { time: new Date().toISOString(), message };
  if (meta) entry.meta = meta;
  console.log(JSON.stringify(entry));
}

// ---------- HEALTH ----------
app.get("/health", (req, res) => {
  log("🩺 Health check hit");
  res.status(200).json({
    status: "ok",
    uptime: `${Math.round(process.uptime())}s`,
    version: VERSION,
    environment: NODE_ENV,
  });
});

// ---------- ROUTE IMPORTS ----------
async function safeImport(routePath, description) {
  try {
    const abs = path.resolve(__dirname, routePath);
    const mod = await import(pathToFileURL(abs).href);
    if (typeof mod.default === "function") {
      app.use(mod.default);
      log(`✅ Mounted route: ${description}`);
    } else {
      log(`⚠️ ${description} missing default export`);
    }
  } catch (err) {
    log(`❌ Failed to load ${description}`, { error: err.message });
  }
}

// Load key routes
await safeImport("./routes/rewrite.js", "Rewrite API");
await safeImport("./routes/podcast.js", "Podcast API");

// ---------- FALLBACK 404 ----------
app.use((req, res) => {
  log("⚠️ 404 Not Found", { url: req.originalUrl });
  res.status(404).json({ error: "Not found" });
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
});

// ---------- HEARTBEAT ----------
setInterval(() => {
  log(`⏱️ Heartbeat: uptime ${Math.round(process.uptime())}s`);
}, 30 * 60 * 1000);

// ---------- CLEAN EXIT ----------
process.on("SIGTERM", () => {
  log("🛑 SIGTERM received, shutting down...");
  process.exit(0);
});
process.on("SIGINT", () => {
  log("🛑 SIGINT received, shutting down...");
  process.exit(0);
});

// AI Podcast Suite — Stable Production Server
// Version: 2025.10.10-Routes-Fix
// ✅ Modular route imports
// ✅ Clean JSON logging
// ✅ Always-on health and heartbeat
// ✅ Correct path resolution for /routes folder
// ✅ Shiper-verified for Node 22.x (ESM)

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
const VERSION = "2025.10.10-Routes-Fix";

// ─────────────────────────────────────────────
// LOGGING (consistent JSON output for Shiper)
// ─────────────────────────────────────────────
function log(message, meta) {
  const line = { time: new Date().toISOString(), message };
  if (meta) line.meta = meta;
  console.log(JSON.stringify(line));
}

// ─────────────────────────────────────────────
// HEALTH ENDPOINT (always logs when hit)
// ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  log("🩺 Health check hit");
  res.status(200).json({
    status: "ok",
    uptime: `${Math.round(process.uptime())}s`,
    version: VERSION,
    environment: NODE_ENV,
  });
});

// ─────────────────────────────────────────────
// ROUTE MOUNTS (explicit imports for reliability)
// ─────────────────────────────────────────────
async function mountRoutes() {
  const routesDir = path.resolve(__dirname, "./routes");

  const routeDefs = [
    { file: "rewrite.js", mount: "/", name: "Rewrite API" },
    { file: "podcast.js", mount: "/", name: "Podcast API" },
    { file: "rss.js", mount: "/", name: "RSS API" },
  ];

  for (const { file, mount, name } of routeDefs) {
    const abs = path.join(routesDir, file);
    try {
      const mod = await import(pathToFileURL(abs).href);
      if (mod.default) {
        app.use(mount, mod.default);
        log(`✅ Mounted route: ${name}`);
      } else {
        log(`⚠️ ${name} missing default export`);
      }
    } catch (err) {
      log(`❌ Failed to load ${name}`, { error: err.message });
    }
  }
}

// ─────────────────────────────────────────────
// FALLBACK 404 (always logs the URL)
// ─────────────────────────────────────────────
app.use((req, res) => {
  log("⚠️ 404 Not Found", { url: req.originalUrl });
  res.status(404).json({ error: "Not found" });
});

// ─────────────────────────────────────────────
// START SERVER (waits until routes are mounted)
// ─────────────────────────────────────────────
await mountRoutes();

app.listen(PORT, () => {
  log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
});

// ─────────────────────────────────────────────
// HEARTBEAT (visible every 30 minutes)
// ─────────────────────────────────────────────
setInterval(() => {
  log(`⏱️ Heartbeat: uptime ${Math.round(process.uptime())}s`);
}, 30 * 60 * 1000);

// ─────────────────────────────────────────────
// CLEAN EXIT HANDLERS
// ─────────────────────────────────────────────
process.on("SIGTERM", () => {
  log("🛑 SIGTERM received — shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  log("🛑 SIGINT received — shutting down gracefully");
  process.exit(0);
});

// server.js — AI Podcast Suite (2025.10.10-AbsoluteRouteFix)
import express from "express";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import process from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";

// ── Logger ─────────────────────────────
function log(message, meta = null) {
  const entry = { time: new Date().toISOString(), message, ...(meta ? { meta } : {}) };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// ── Health ─────────────────────────────
app.get("/health", (req, res) => {
  log("🩺 Health check hit");
  res.json({ ok: true, uptime: `${Math.round(process.uptime())}s`, env: NODE_ENV });
});

// ── Load routes using ABSOLUTE file URLs ───────────
try {
  const routesDir = path.resolve(__dirname, "routes");
  const rewritePath = path.join(routesDir, "rewrite.js");
  const podcastPath = path.join(routesDir, "podcast.js");

  log("🔍 Importing routes from", { rewritePath, podcastPath });

  const rewriteModule = await import(pathToFileURL(rewritePath).href);
  const podcastModule = await import(pathToFileURL(podcastPath).href);

  if (rewriteModule?.default && typeof rewriteModule.default === "function") {
    app.use("/api/rewrite", rewriteModule.default);
    log("✅ Mounted /api/rewrite");
  } else {
    log("❌ rewrite.js did not export a valid router", { keys: Object.keys(rewriteModule) });
  }

  if (podcastModule?.default && typeof podcastModule.default === "function") {
    app.use("/api/podcast", podcastModule.default);
    log("✅ Mounted /api/podcast");
  } else {
    log("⚠️ podcast.js invalid export");
  }

  // 🧩 Debug route
  app.get("/api/debug/routes", (req, res) => {
    const list = [];
    app._router.stack.forEach(mw => {
      if (mw.route) {
        const methods = Object.keys(mw.route.methods).map(m => m.toUpperCase());
        list.push({ path: mw.route.path, methods });
      } else if (mw.name === "router" && mw.handle.stack) {
        mw.handle.stack.forEach(h => {
          if (h.route) {
            const methods = Object.keys(h.route.methods).map(m => m.toUpperCase());
            list.push({
              base: mw.regexp?.source,
              path: h.route.path,
              methods,
            });
          }
        });
      }
    });
    res.json({ routes: list });
  });

  log("✅ All routes attached successfully");
} catch (err) {
  log("❌ Route load failed", { error: err.message });
}

// ── 404 handler (must be last) ─────────────
app.use((req, res) => {
  log("⚠️ 404 Not Found", { path: req.originalUrl, method: req.method });
  res.status(404).json({ error: "Endpoint not found" });
});

// ── Start server ────────────────────────
app.listen(PORT, () => log(`🚀 Server running on port ${PORT} (${NODE_ENV})`));

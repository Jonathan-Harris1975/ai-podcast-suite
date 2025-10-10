// server.js — AI Podcast Suite (2025.10.10-SledgehammerFix)
import express from "express";
import process from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "production";

// ── logger
function log(message, meta = null) {
  const entry = { time: new Date().toISOString(), message, ...(meta ? { meta } : {}) };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// ── health (simple)
app.get("/health", (req, res) => {
  log("🩺 Health check hit");
  res.status(200).json({
    status: "ok",
    uptime: `${Math.round(process.uptime())}s`,
    environment: NODE_ENV,
  });
});

// ── HARDENED: direct handler for /api/rewrite (works even if router import fails)
app.post("/api/rewrite", (req, res) => {
  log("🧩 rss:rewrite-pipeline-start");
  // fire-and-forget
  setImmediate(async () => {
    try {
      const mod = await import(path.join(__dirname, "services/rss-feed-creator/services/rewrite-pipeline.js"));
      if (typeof mod.runRewritePipeline === "function") {
        await mod.runRewritePipeline();
        log("🧩 rss:rewrite-pipeline-complete");
      } else {
        log("🧩 rss:rewrite-pipeline-error", { error: "runRewritePipeline not exported" });
      }
    } catch (err) {
      log("🧩 rss:rewrite-pipeline-error", { error: err?.message || String(err) });
    }
  });
  res.status(202).json({ ok: true, message: "Rewrite pipeline triggered" });
});

// ── optional: load modular routes (will co-exist with direct handler above)
async function loadRoutes() {
  try {
    // REWRITE route module (optional)
    try {
      const rewriteModule = await import(path.join(__dirname, "routes/rewrite.js"));
      if (rewriteModule?.default && typeof rewriteModule.default === "function") {
        app.use("/api/rewrite", rewriteModule.default);
        log("✅ /api/rewrite router attached");
      }
    } catch (e) {
      log("⚠️ /routes/rewrite.js import skipped", { error: e.message });
    }

    // PODCAST route (optional)
    try {
      const podcastModule = await import(path.join(__dirname, "routes/podcast.js"));
      if (podcastModule?.default && typeof podcastModule.default === "function") {
        app.use("/api/podcast", podcastModule.default);
        log("✅ /api/podcast router attached");
      }
    } catch (e) {
      log("⚠️ /routes/podcast.js import skipped", { error: e.message });
    }

    log("✅ Routes loaded successfully");
  } catch (err) {
    log("❌ Route loading failed", { error: err.message });
  }
}

// ── deep route inspector (so you can verify in browser)
app.get("/api/_routes", (_req, res) => {
  function listRoutes(stack, prefix = "") {
    const out = [];
    for (const layer of stack || []) {
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods || {}).map(m => m.toUpperCase());
        out.push({ path: prefix + layer.route.path, methods });
      } else if (layer.name === "router" && layer.handle?.stack) {
        const nested = listRoutes(layer.handle.stack, prefix + (layer.regexp?.fast_slash ? "" : (layer.regexp?.source || "")));
        out.push(...nested);
      }
    }
    return out;
  }
  const routes = listRoutes(app._router?.stack || []);
  log("🧭 Active routes dump", { count: routes.length });
  res.json({ routes });
});

// ── 404 LAST
app.use((req, res) => {
  log("⚠️ 404 Not Found", { path: req.originalUrl, method: req.method });
  res.status(404).json({ error: "Endpoint not found" });
});

// ── start AFTER routes
(async () => {
  await loadRoutes();
  app.listen(PORT, () => log(`🚀 Server running on port ${PORT} (${NODE_ENV})`));
  setInterval(() => log("⏱️ Heartbeat", { uptime: `${Math.round(process.uptime())}s` }), 30 * 60 * 1000);
})();

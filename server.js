// server.js
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { log } from "./utils/logger.js";

import rssRoutes from "./routes/rss.js";
import rewriteRoutes from "./routes/rewrite.js";

const app = express();

// ─────────────────────────────────────────────
// Core middleware
// ─────────────────────────────────────────────
app.use(helmet());
app.use(cors());

// Lightweight request logger (for all routes)
app.use((req, _res, next) => {
  log.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Lenient JSON parser for /api to handle empty or weird bodies
app.use("/api", express.json({ strict: false, limit: "1mb", type: "*/*" }));

// Standard JSON parser for everything else
app.use("/", express.json());

// ─────────────────────────────────────────────
// Health route
// ─────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ ok: true }));

// ─────────────────────────────────────────────
// Route mounting order
// Ensure /api takes priority over /
// ─────────────────────────────────────────────
app.use("/api", rewriteRoutes);
app.use("/", rssRoutes);

// ─────────────────────────────────────────────
// Initialization logs
// ─────────────────────────────────────────────
log.info("✅ Environment variables OK");
log.info("🚀 Main AI Podcast Service initialized");
log.info("✅ Loaded main service module keys: default");

export default app;

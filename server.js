// server.js
import express from "express";
import cors from "cors";
import { log } from "./utils/logger.js";  // ✅ Fixed import path

import rewriteRoutes from "./routes/rewrite.js";
import rssRoutes from "./routes/rss.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ strict: false, limit: "1mb", type: "*/*" }));

// Simple request logger
app.use((req, _res, next) => {
  try {
    log.info(`${req.method} ${req.originalUrl}`);
  } catch {
    console.log(`${req.method} ${req.originalUrl}`);
  }
  next();
});

// Routes
app.use("/api", rewriteRoutes);
app.use("/rss", rssRoutes);

// Health check route
app.get("/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Export app — no listen() here
export default app;

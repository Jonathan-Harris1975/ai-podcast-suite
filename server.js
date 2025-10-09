/**
 * Root Server — Shiper-ready
 * Uses unified env check and R2 validator.
 */
import express from "express";
import { validateEnv } from "./services/env-checker.js";
import { validateR2Once } from "./services/r2-client.js";

const app = express();
app.use(express.json());

validateEnv();
await validateR2Once();

const VERSION = "2025.10.09";
const NODE_ENV = process.env.NODE_ENV || "production";
const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    version: VERSION,
    uptime: `${Math.round(process.uptime() / 60)} minutes`,
    environment: NODE_ENV,
    services: { rss_feed_creator: "ok", script: "ok", tts: "ok", artwork: "ok", podcast: "ok" }
  });
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
export default app;

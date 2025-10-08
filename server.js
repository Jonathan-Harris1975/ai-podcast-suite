// server.js
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { log } from "utils/logger.js";

import rssRoutes from "./routes/rss.js";
import rewriteRoutes from "./routes/rewrite.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/", rssRoutes);
app.use("/api", rewriteRoutes);

log.info("✅ Environment variables OK");
log.info("🚀 Main AI Podcast Service initialized");

export default app;

process.on('uncaughtException', err => console.error('❌ Uncaught Exception:', err));
process.on('unhandledRejection', err => console.error('❌ Unhandled Rejection:', err));

import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import rssRoutes from "./routes/rss.js";
import rewriteRoutes from "./routes/rewrite.js";
import { log } from "./utils/logger.js";
import { checkEnv } from "./utils/envCheck.rss.js";

dotenv.config();
checkEnv();

const app = express();
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "rss-feed-creator" });
});

app.use("/api", rssRoutes);
app.use("/api", rewriteRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  log.info({ port: PORT }, "📰 RSS Feed Creator running");
});

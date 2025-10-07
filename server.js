// server.js
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { log } from "./utils/logger.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Example routes (keep your originals)
app.get("/health", (req, res) => res.json({ ok: true }));

// Import and mount other routes
import rssRoutes from "./routes/rss.js";
import rewriteRoutes from "./routes/rewrite.js";
app.use("/", rssRoutes);
app.use("/api", rewriteRoutes);

// ✅ Export app (do not start server here)
export default app;

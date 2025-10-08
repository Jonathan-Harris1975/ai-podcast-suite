import express from "express";
 import helmet from "helmet";
 import cors from "cors";
 import { log } from "./utils/logger.js";

 import rssRoutes from "./routes/rss.js";
 import rewriteRoutes from "./routes/rewrite.js";

 const app = express();
 app.use(helmet());
 app.use(cors());
- app.use(express.json());
+
+ // Lightweight request log so you can see traffic
+ app.use((req, _res, next) => { log.info(`${req.method} ${req.originalUrl}`); next(); });
+
+ // Lenient JSON just for /api to avoid empty-body JSON errors
+ app.use("/api", express.json({ strict: false, limit: "1mb", type: "*/*" }));
+ // Default JSON for others, if needed
+ app.use("/", express.json());

 app.get("/health", (req, res) => res.json({ ok: true }));

- app.use("/", rssRoutes);
- app.use("/api", rewriteRoutes);
+ app.use("/api", rewriteRoutes);  // ensure /api takes priority
+ app.use("/", rssRoutes);

 log.info("✅ Environment variables OK");
 log.info("🚀 Main AI Podcast Service initialized");

 export default app;

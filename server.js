import express from "express";
import helmet from "helmet";
import cors from "cors";
import { logger } from "./src/utils/logger.js";
import { env } from "./src/utils/env.js";
import healthRouter from "./src/routes/health.js";
import startRouter from "./src/routes/start.js";
import cleanRouter from "./src/routes/clean.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    ok: true,
    name: env.APP_TITLE,
    desc: env.APP_DESC,
    version: "1.0.0"
  });
});

app.use("/health", healthRouter);
app.use("/start", startRouter);
app.use("/clean-temp", cleanRouter);

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  logger.info({
    port: String(PORT),
    appTitle: env.APP_TITLE,
    appDesc: env.APP_DESC
  }, "🚀 Orchestrator service running");
});

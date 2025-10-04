import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import { httpLogger, log } from "./utils/logger.js";
import { checkEnvFatal } from "./utils/envCheck.js";
import { healthRouter } from "./routes/health.js";
import { startRouter } from "./routes/startProcess.js";
import { cleanerRouter } from "./routes/cleaner.js";

dotenv.config();
checkEnvFatal();

const app = express();

// capture raw body for optional signature checks
app.use((req, res, next) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    req.rawBody = Buffer.concat(chunks);
    next();
  });
});

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(httpLogger);

app.use(healthRouter);
app.use(startRouter);
app.use(cleanerRouter);

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  log.info({ port: PORT }, "🚀 ai-podcast-suite running");
});

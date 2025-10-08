// server.js
import express from "express";
import compression from "compression";
import helmet from "helmet";
import dotenv from "dotenv";
import chalk from "chalk";
import fetch from "node-fetch";
import { validateEnv } from "./utils/validateEnv.js";

// Load environment variables first
dotenv.config();

// Retry configuration
const RETRY_LIMIT = 3;
const RETRY_DELAY_MS = 4000; // 4 seconds between attempts

// ---------------- Helper: Ping R2 Endpoint ----------------
async function pingR2Endpoint() {
  const endpoint = process.env.R2_ENDPOINT;
  if (!endpoint) throw new Error("R2_ENDPOINT is not set");

  try {
    const response = await fetch(endpoint, { method: "HEAD" });
    if (!response.ok) {
      throw new Error(`R2 responded with HTTP ${response.status}`);
    }
    console.log(chalk.greenBright(`☁️ Verified R2 endpoint reachable: ${endpoint}`));
  } catch (err) {
    throw new Error(`Unable to reach R2 endpoint (${endpoint}): ${err.message}`);
  }
}

// ---------------- Helper: Validate + Ping with Retry ----------------
async function tryValidateEnvWithRetry() {
  let attempt = 1;
  while (attempt <= RETRY_LIMIT) {
    try {
      console.log(
        chalk.cyanBright(`\n🔍 Attempt ${attempt}/${RETRY_LIMIT}: validating environment...`)
      );

      // Validate environment variables
      validateEnv();

      // Check Cloudflare R2 connectivity
      console.log(chalk.cyanBright("🌐 Pinging Cloudflare R2 endpoint..."));
      await pingR2Endpoint();

      console.log(chalk.greenBright("✅ Environment + R2 validation succeeded.\n"));
      return true;
    } catch (err) {
      console.error(
        chalk.redBright(
          `❌ Validation failed (attempt ${attempt}/${RETRY_LIMIT}): ${err.message}`
        )
      );
      if (attempt < RETRY_LIMIT) {
        console.log(chalk.yellowBright(`⏳ Retrying in ${RETRY_DELAY_MS / 1000}s...\n`));
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        console.error(
          chalk.redBright(`\n🚨 All ${RETRY_LIMIT} validation attempts failed. Exiting.\n`)
        );
        process.exit(1);
      }
      attempt++;
    }
  }
}

// Run pre-flight validation before booting the server
await tryValidateEnvWithRetry();

// ---------------- Express App ----------------
const app = express();
app.use(helmet());
app.use(compression());
app.use(express.json());

// Healthcheck for Shiper container orchestration
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("🚀 AI Podcast Suite is running successfully on Shiper!");
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(chalk.greenBright(`\n✅ Server is live on port ${PORT}`));
  console.log(chalk.magentaBright(`🌐 Healthcheck: http://localhost:${PORT}/health\n`));
});

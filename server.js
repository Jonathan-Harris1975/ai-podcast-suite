// ANSI color helper (replaces chalk)
const colors = {
  reset: (msg) => `${msg}\x1b[0m`,
  red:   (msg) => `\x1b[31m${msg}\x1b[0m`,
  yellow:(msg) => `\x1b[33m${msg}\x1b[0m`,
  blue:  (msg) => `\x1b[34m${msg}\x1b[0m`,
  cyan:  (msg) => `\x1b[36m${msg}\x1b[0m`,
  magenta:(msg)=> `\x1b[35m${msg}\x1b[0m`,
  gray:  (msg) => `\x1b[90m${msg}\x1b[0m`,
  green: (msg) => `\x1b[32m${msg}\x1b[0m`,
  cyanBright: (msg) => `\x1b[96m${msg}\x1b[0m`,
  redBright: (msg) => `\x1b[91m${msg}\x1b[0m`,
  greenBright: (msg) => `\x1b[92m${msg}\x1b[0m`,
  magentaBright: (msg) => `\x1b[95m${msg}\x1b[0m`
};

// server.js
import express from "express";
import compression from "compression";
import helmet from "helmet";
import dotenv from "dotenv";

import fetch from "node-fetch";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
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
    console.log(colors.cyan(`☁️ Verified R2 endpoint reachable: ${endpoint}`));
  } catch (err) {
    throw new Error(`Unable to reach R2 endpoint (${endpoint}): ${err.message}`);
  }
}

// ---------------- Helper: Verify R2 Bucket Exists ----------------
async function verifyR2Bucket() {
  const endpoint = process.env.R2_ENDPOINT;
  const region = process.env.R2_REGION || "auto";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_RSS_FEEDS || "rss-feeds";

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY");
  }

  const s3 = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  try {
    const command = new HeadBucketCommand({ Bucket: bucket });
    await s3.send(command);
    console.log(colors.cyan(`📦 Verified R2 bucket exists: ${bucket}`));
  } catch (err) {
    throw new Error(`Cannot access R2 bucket "${bucket}": ${err.message}`);
  }
}

// ---------------- Helper: Validate + Ping + Verify with Retry ----------------
async function tryValidateEnvWithRetry() {
  let attempt = 1;
  while (attempt <= RETRY_LIMIT) {
    try {
      console.log(
        colors.blue(`\n🔍 Attempt ${attempt}/${RETRY_LIMIT}: validating environment...`)
      );

      // Validate environment variables
      validateEnv();

      // Ping R2 endpoint
      console.log(colors.yellow("🌐 Pinging Cloudflare R2 endpoint..."));
      await pingR2Endpoint();

      // Verify R2 bucket exists
      console.log(colors.yellow("🪣 Verifying R2 bucket accessibility..."));
      await verifyR2Bucket();

      console.log(colors.green("✅ Environment, R2 endpoint, and bucket validation succeeded.\n"));
      return true;
    } catch (err) {
      console.error(
        colors.red(
          `❌ Validation failed (attempt ${attempt}/${RETRY_LIMIT}): ${err.message}`
        )
      );
      if (attempt < RETRY_LIMIT) {
        console.log(colors.yellow(`⏳ Retrying in ${RETRY_DELAY_MS / 1000}s...\n`));
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        console.error(
          colors.redBright(`\n🚨 All ${RETRY_LIMIT} validation attempts failed. Exiting.\n`)
        );
        process.exit(1);
      }
      attempt++;
    }
  }
}

// ---------------- Run pre-flight checks ----------------
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

// ---------------- Secure R2 Diagnostic Route ----------------
app.get("/api/check-r2", async (req, res) => {
  const token = req.query.token;
  const expectedToken = process.env.R2_CHECK_TOKEN; // set in Shiper env

  if (!expectedToken) {
    return res.status(500).json({ error: "R2_CHECK_TOKEN not set on server." });
  }

  if (token !== expectedToken) {
    return res.status(403).json({ error: "Unauthorized: invalid or missing token." });
  }

  const endpoint = process.env.R2_ENDPOINT;
  const region = process.env.R2_REGION || "auto";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_RSS_FEEDS || "rss-feeds";

  const status = {
    timestamp: new Date().toISOString(),
    endpoint,
    bucket,
    endpointReachable: false,
    bucketAccessible: false,
  };

  try {
    // Ping R2 endpoint
    const headResp = await fetch(endpoint, { method: "HEAD" });
    status.endpointReachable = headResp.ok;

    // Verify bucket accessibility
    const s3 = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
    const command = new HeadBucketCommand({ Bucket: bucket });
    await s3.send(command);
    status.bucketAccessible = true;

    return res.json({
      ok: true,
      message: "R2 endpoint and bucket verified successfully.",
      details: status,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "R2 check failed.",
      error: err.message,
      details: status,
    });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("🚀 AI Podcast Suite is running successfully on Shiper!");
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(colors.green(`\n✅ Server is live on port ${PORT}`));
  console.log(colors.cyan(`🌐 Healthcheck: http://localhost:${PORT}/health\n`));
});

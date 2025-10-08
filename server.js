// server.js
import express from "express";
import compression from "compression";
import helmet from "helmet";
import dotenv from "dotenv";
import chalk from "chalk";
import { validateEnv } from "./utils/validateEnv.js";

// Load .env first
dotenv.config();

// Run environment validation before boot
try {
  console.log(chalk.cyanBright("\n🔍 Running startup environment validation...\n"));
  validateEnv();
} catch (err) {
  console.error(chalk.redBright(`\n❌ Environment validation failed:\n${err.message}\n`));
  process.exit(1);
}

// Initialize Express
const app = express();
app.use(helmet());
app.use(compression());
app.use(express.json());

// Simple healthcheck route for Shiper container monitoring
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("🚀 AI Podcast Suite is running successfully on Shiper!");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(chalk.greenBright(`\n✅ Server is live on port ${PORT}`));
  console.log(chalk.magentaBright(`🌐 Healthcheck: http://localhost:${PORT}/health\n`));
});

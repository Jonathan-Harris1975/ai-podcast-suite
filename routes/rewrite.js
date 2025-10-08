// routes/rewrite.js
import express from "express";
import { log } from "../utils/logger.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- AUTO-DETECT ROOT ---
let candidatePaths = [
  path.resolve(__dirname, "../../../services/rss-feed-creator/services/rewrite-pipeline.js"), // local dev (if routes inside ai-podcast-suite-main)
  path.resolve(__dirname, "../../ai-podcast-suite-main/services/rss-feed-creator/services/rewrite-pipeline.js"), // container layout (/app/routes/)
  path.resolve(__dirname, "../services/rss-feed-creator/services/rewrite-p

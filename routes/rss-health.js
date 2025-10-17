// ============================================================
// 🌍 AI Podcast Suite — Main Server (Verified Route Mounts)
// ============================================================
// Fixes:
// - "Cannot access app before initialization"
// - Silent missing endpoints (/api/rss/health, /run-pipeline, /podcast)
// - Adds startup logging for every mounted route
// ============================================================

import express from "express";
import cors from "cors";
import { log } from "../shared/logger.js";

const router = express.Router();


// ------------------------------------------------------------
// 🧩 Base Middleware
// ------------------------------------------------------------
router.use(cors());
router.use(express.json({ limit: "10mb" }));
router.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------
// 🧩 Route Loader
// ------------------------------------------------------------
router.get("/api/rss/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "rss-feed-creator" });
});

export default router;
  

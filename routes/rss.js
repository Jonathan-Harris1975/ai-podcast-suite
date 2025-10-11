// /routes/rss.js — Render Safe (2025.10.11)
import express from "express";
import { getObject } from "../services/shared/utils/r2-client.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const xml = await getObject("rss.xml");
    const validXml =
      typeof xml === "string" && xml.trim().length > 0
        ? xml
        : `<rss><channel><title>No RSS Found</title></channel></rss>`;

    res.set("Content-Type", "application/rss+xml");
    res.status(200).send(validXml);
  } catch (err) {
    console.error("❌ RSS route failed:", err);
    res.status(500).json({
      success: false,
      error: err && err.message ? err.message : "Unknown RSS error",
    });
  }
});

export default router;

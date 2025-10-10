// /routes/rss.js
import express from "express";
import { getObject } from "../services/shared/utils/r2-client.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const xml = await getObject("rss.xml");
    res.set("Content-Type", "application/rss+xml");
    res.send(xml || "<rss><channel><title>No RSS Found</title></channel></rss>");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

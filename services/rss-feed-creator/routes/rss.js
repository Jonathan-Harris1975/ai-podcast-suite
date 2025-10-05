import express from "express";
import { getObject } from "../utils/r2-client.js";  // ✅ correct

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const rss = await getObject("data/rss.xml");  // ✅ correct
    if (!rss) {
      res.status(404).send("RSS feed not found");
      return;
    }
    res.set("Content-Type", "application/rss+xml; charset=utf-8");
    res.send(rss);
  } catch (err) {
    console.error("❌ Error fetching RSS:", err);
    res.status(500).send("Internal server error");
  }
});

export default router;

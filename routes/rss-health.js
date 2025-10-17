import express from "express";
import { R2_BUCKETS, getObjectAsText } from "#shared/r2-client.js";
import { info, error } from "#shared/logger.js";

const router = express.Router();

router.get("/api/rss/health", async (_req, res) => {
  try {
    const b = R2_BUCKETS.RSS_FEEDS || R2_BUCKETS.META;
    const active = await getObjectAsText(b, "utils/active-feeds.json");
    const state = await getObjectAsText(b, "utils/feed-state.json");

    const ok = Boolean(active && state);
    info("🧠 RSS health check", { ok });

    return res.json({
      ok,
      details: {
        activePresent: !!active,
        statePresent: !!state,
        bucket: b,
      },
    });
  } catch (err) {
    error("💥 RSS health failed", { error: err.message });
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;

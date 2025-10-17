// ============================================================
// 🧪 RSS Health Route
// ============================================================
//
// GET /api/rss/health  ->  { ok, details }
// Ensures active-feeds.json + feed-state.json exist in R2.
// ============================================================

import express from "express";
import { R2_BUCKETS, getObjectAsText } from "#shared/r2-client.js";
import { info, warn, error } from "#shared/logger.js";

const router = express.Router();

function bucket() {
  return R2_BUCKETS.RSS_FEEDS || R2_BUCKETS.META;
}

router.get("/api/rss/health", async (_req, res) => {
  const b = bucket();
  if (!b) {
    warn("rss.health.nobucket");
    return res.status(500).json({ ok: false, error: "No RSS bucket configured" });
  }

  try {
    const active = await getObjectAsText(b, "utils/active-feeds.json");
    const state = await getObjectAsText(b, "utils/feed-state.json");

    const ok = Boolean(active && state);
    info("rss.health.checked", { ok });

    return res.json({
      ok,
      details: {
        activePresent: !!active,
        statePresent: !!state,
        bucket: b,
      },
    });
  } catch (err) {
    error("rss.health.error", { error: err.message });
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;

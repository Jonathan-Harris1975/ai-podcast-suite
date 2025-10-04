import { Router } from "express";
import { logger } from "../utils/logger.js";
import { runPipeline } from "../run.js";
const router = Router();

router.post("/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  res.json({ ok: true, sessionId, message: "Pipeline started" });
  try {
    await runPipeline(sessionId);
  } catch (err) {
    logger.error({ err }, "❌ Pipeline failed");
  }
});

export default router;

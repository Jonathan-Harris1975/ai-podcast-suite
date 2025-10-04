import { Router } from "express";
// routes/health.js
import { state } from "../state.js";
const router = Router();
router.get("/", (req, res) => {
  res.json({
    ok: true,
    services: {
      script: state.last.script,
      artwork: state.last.artwork,
      tts: state.last.tts
    },
    lastRun: state.last.run
  });
});
export default router;

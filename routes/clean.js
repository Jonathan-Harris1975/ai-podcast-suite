import { Router } from "express";
import { cleanSessionTemp } from "../utils/temp.js";
const router = Router();
router.post("/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const out = cleanSessionTemp(sessionId);
  return res.json({ ok: true, sessionId, ...out });
});
export default router;

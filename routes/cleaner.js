import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();

// Resolve project directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Temporary session directory
const tempDir = path.join(__dirname, "../temp");

// Manual cleaner endpoint
router.post("/", async (req, res) => {
  try {
    const sessionId = req.body.sessionId;

    if (!sessionId) {
      return res.status(400).json({ ok: false, error: "Missing sessionId" });
    }

    const sessionPath = path.join(tempDir, sessionId);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    res.json({ ok: true, message: `Temp files for session ${sessionId} removed.` });
  } catch (err) {
    console.error("Cleaner error:", err);
    res.status(500).json({ ok: false, error: "Cleanup failed" });
  }
});

// ✅ export with the expected name
export const cleanerRouter = router;

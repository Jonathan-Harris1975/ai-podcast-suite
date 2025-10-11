import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "🎙️ Podcast endpoint placeholder active" });
});

export default router;

// routes/rewrite.js — static hello router for mount verification
import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({ ok: true, route: "rewrite-root" });
});

router.get("/ping", (req, res) => {
  res.status(200).json({ ok: true, pong: true });
});

router.post("/run", (req, res) => {
  res.status(200).json({ ok: true, message: "rewrite pipeline stub" });
});

export default router;

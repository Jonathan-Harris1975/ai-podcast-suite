import crypto from "crypto";
import { log } from "./logger.js";

function compute(rawBody, secret) {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
}

export function optionalVerify(req, res, next) {
  const enabled = (process.env.WEBHOOKS_ENABLED || "false").toLowerCase() === "true";
  const secret = process.env.HOOKDECK_WEBHOOK_SECRET;
  if (!enabled || !secret) return next();

  const sig = req.headers["x-hookdeck-signature"];
  if (!sig) return res.status(401).json({ error: "Missing signature" });
  if (!req.rawBody) return res.status(400).json({ error: "Raw body required" });

  const computed = compute(req.rawBody, secret);
  if (computed !== sig) {
    log.error({ sig, computed }, "❌ Invalid webhook signature");
    return res.status(401).json({ error: "Invalid signature" });
  }
  return next();
}

// ============================================================
// 🧠 AI Podcast Suite — Unified Temporary Storage Manager
// ============================================================

import fs from "fs";
import path from "path";
import os from "os";
import { info, warn, error } from "./logger.js";

export const TEMP_DIR = path.resolve("/app/tmp");

// Ensure tmp directory exists
export function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    info("temp.dir.created", { TEMP_DIR });
  }
  return TEMP_DIR;
}

// Get a full path inside the temp directory
export function getTempPath(filename) {
  ensureTempDir();
  return path.join(TEMP_DIR, filename);
}

// Generate a unique temp file (with optional prefix/suffix)
export function createTempFile(prefix = "tmp", ext = "") {
  ensureTempDir();
  const unique = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  return path.join(TEMP_DIR, unique);
}

// Cleanup utility
export function clearTempDir() {
  if (!fs.existsSync(TEMP_DIR)) return;
  try {
    for (const file of fs.readdirSync(TEMP_DIR)) {
      fs.rmSync(path.join(TEMP_DIR, file), { recursive: true, force: true });
    }
    info("temp.dir.cleared", { TEMP_DIR });
  } catch (err) {
    warn("temp.dir.cleanup.fail", { error: err.message });
  }
}

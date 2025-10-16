// ============================================================
// 🧠 AI Podcast Suite — Unified Storage Manager
// ============================================================
//
// Provides a single, consistent interface for both temporary
// (ephemeral, per-session) and persistent (long-term local)
// storage used across the suite.
//
// TEMP_DIR  → /app/tmp         → used for transient data (chunks, merges, etc.)
// STORAGE_DIR → /app/storage   → used for cached or retained data between runs
//
// ------------------------------------------------------------

import fs from "fs";
import path from "path";
import os from "os";
import { log } from "./logger.js";

// ============================================================
// 📁 DIRECTORY CONSTANTS
// ============================================================

// Temp (ephemeral)
export const TEMP_DIR = path.resolve("/app/tmp");

// Persistent (semi-durable local storage, e.g., cache, logs)
export const STORAGE_DIR = path.resolve("/app/storage");

// ============================================================
// 🧩 DIRECTORY INITIALIZATION
// ============================================================

function ensureDir(dirPath, label) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log.info(`storage.${label}.created`, { dir: dirPath });
  }
  return dirPath;
}

export function ensureTempDir() {
  return ensureDir(TEMP_DIR, "temp");
}

export function ensureStorageDir() {
  return ensureDir(STORAGE_DIR, "storage");
}

// ============================================================
// 🧠 PATH HELPERS
// ============================================================

export function getTempPath(filename) {
  ensureTempDir();
  return path.join(TEMP_DIR, filename);
}

export function getStoragePath(filename) {
  ensureStorageDir();
  return path.join(STORAGE_DIR, filename);
}

export function createTempFile(prefix = "tmp", ext = "") {
  ensureTempDir();
  const unique = `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}${ext}`;
  return path.join(TEMP_DIR, unique);
}

export function createStorageFile(prefix = "file", ext = "") {
  ensureStorageDir();
  const unique = `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}${ext}`;
  return path.join(STORAGE_DIR, unique);
}

// ============================================================
// 🧹 CLEANUP UTILITIES
// ============================================================

function clearDir(dirPath, label) {
  if (!fs.existsSync(dirPath)) return;
  try {
    for (const file of fs.readdirSync(dirPath)) {
      fs.rmSync(path.join(dirPath, file), { recursive: true, force: true });
    }
    log.info(`storage.${label}.cleared`, { dir: dirPath });
  } catch (err) {
    log.warn(`storage.${label}.cleanup.fail`, { error: err.message });
  }
}

export function clearTempDir() {
  clearDir(TEMP_DIR, "temp");
}

export function clearStorageDir() {
  clearDir(STORAGE_DIR, "storage");
}

// ============================================================
// 🚀 STARTUP INITIALIZATION
// ============================================================

export function initStorage() {
  ensureTempDir();
  ensureStorageDir();
  log.info("storage.init.complete", {
    TEMP_DIR,
    STORAGE_DIR,
  });
  return { TEMP_DIR, STORAGE_DIR };
}

// ============================================================
// 🧩 AUTO-CLEANUP ON EXIT
// ============================================================

process.on("exit", () => clearTempDir());
process.on("SIGINT", () => clearTempDir());
process.on("SIGTERM", () => clearTempDir());

// /services/rss-feed-creator/services/rewrite-pipeline.js
import fetch from "node-fetch";
import Parser from "rss-parser";
import { log } from "../utils/logger.js";
import { getObject, putJson } from "../utils/r2-client.js";
import { callOpenRouterModel } from "../utils/models.js";
import { rebuildRss } from "./build-rss.js";
import { createShortLink } from "../utils/shortio.js";

const parser = new Parser();

// R2 keys
const ITEMS_KEY = "items.json";
const FEEDS_KEY = "feeds.txt";
const URLS_KEY = "urls.txt";
const CURSOR_KEY = "cursor.json";

// Batch limits
const FEEDS_PER_RUN = 5;
const URLS_PER_RUN = 1;
const MAX_ITEMS_PER_FEED = parseInt(process.env.MAX_ITEMS_PER_FEED || "3", 10);

// ────────────────────────────────────────────────────────────────
// Helpers
function parseList(text) {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map

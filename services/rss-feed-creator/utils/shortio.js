// services/rss-feed-creator/utils/shortio.js
// Handles creation of branded short links for RSS feed items via Short.io API
// Enhanced for production stability and detailed logging

import fetch from "node-fetch";
import { info, warn, error } from "../../shared/utils/logger.js";

const SHORTIO_API_KEY = process.env.SHORTIO_API_KEY;
const SHORTIO_DOMAIN = process.env.SHORTIO_DOMAIN || "ai.jonathan-harris.online";

/**
 * Create a branded Short.io link for a given original URL.
 * Falls back to returning the original URL if an error occurs.
 * @param {string} originalUrl - The long URL to shorten.
 * @returns {Promise<string>} - The shortened URL or original if failed.
 */
export async function createShortLink(originalUrl) {
  if (!originalUrl || typeof originalUrl !== "string") {
    warn("shortio.invalid.url", { provided: originalUrl });
    return originalUrl;
  }

  if (!SHORTIO_API_KEY) {
    warn("shortio.missing.key", {
      hint: "Set SHORTIO_API_KEY in environment variables.",
    });
    return originalUrl;
  }

  try {
    const payload = {
      originalURL: originalUrl,
      domain: SHORTIO_DOMAIN,
    };

    const response = await fetch("https://api.short.io/links", {
      method: "POST",
      headers: {
        "Authorization": SHORTIO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Handle network and HTTP errors cleanly
    if (!response.ok) {
      const text = await response.text();
      error("shortio.http.error", {
        status: response.status,
        message: response.statusText,
        body: text.slice(0, 300),
      });
      return originalUrl;
    }

    const data = await response.json();

    if (!data.shortURL) {
      warn("shortio.no.shorturl", {
        domain: SHORTIO_DOMAIN,
        url: originalUrl,
        response: data,
      });
      return originalUrl;
    }

    info("shortio.success", {
      original: originalUrl,
      short: data.shortURL,
      domain: SHORTIO_DOMAIN,
    });

    return data.shortURL;
  } catch (err) {
    // Catch fetch errors, timeouts, malformed JSON, etc.
    error("shortio.exception", {
      message: err.message,
      stack: err.stack?.split("\n").slice(0, 3).join("; "),
      url: originalUrl,
    });
    return originalUrl;
  }
        }

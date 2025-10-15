// Short.io helper for branded RSS feed links
import fetch from "node-fetch";
import { info, error } from "#shared/logger.js";

export async function createShortLink({ originalURL, domain, apiKey }) {
  if (!originalURL || !domain || !apiKey) return null;

  const url = "https://api.short.io/links";
  const body = {
    domain,
    originalURL,
  };

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Short.io API error: ${resp.status} ${text}`);
    }

    const data = await resp.json();
    const short = data?.shortURL || null;
    if (short) {
      info("shortio.success", { original: originalURL, short, domain });
    }
    return short;
  } catch (err) {
    error("shortio.fail", { url: originalURL, error: err.message });
    return null;
  }
}

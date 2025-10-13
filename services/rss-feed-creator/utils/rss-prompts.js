// services/rss-feed-creator/utils/rss-prompts.js
export function rewritePrompt({ title, summary }) {
  return `Rewrite this AI news headline and summary for a professional RSS feed.

Title: ${title}
Summary: ${summary}

Constraints:
- 200–400 characters total
- Factual and neutral tone (British English)
- No marketing, newsletter CTAs, emojis, or hashtags
- No links or “read more”
- One concise paragraph`;
}

export const SYSTEM = "You are a meticulous copy editor for a news RSS feed. You keep text concise, neutral, and free of marketing fluff.";
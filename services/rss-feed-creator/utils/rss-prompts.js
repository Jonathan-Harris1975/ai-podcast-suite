export function buildRewritePrompt({ title, summary }) {
  const t = title || "(untitled)";
  const s = summary || "";
  return [
    "Rewrite this single RSS news item for an AI/tech audience.",
    "Constraints:",
    "- British Gen‑X tone; confident, sharp, no hype.",
    "- 200–400 characters total.",
    "- No emojis, no hashtags, no newsletter sign‑ups, no calls‑to‑action.",
    "- Keep only verifiable facts from the source; no speculation.",
    "- Output ONE compact paragraph. No headings.",
    "",
    `Title: ${t}`,
    `Summary: ${s}`
  ].join("\n");
}

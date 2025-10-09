import { s3, R2_BUCKETS, uploadBuffer, listKeys, getObjectAsText } from "../../r2-client.js";
export default function chunkText(text, maxLength = 3500) {
  const chunks = [];
  let currentChunk = '';

  for (const paragraph of text.split('\n\n')) {
    if ((currentChunk + paragraph).length > maxLength) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += paragraph + '\n\n';
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

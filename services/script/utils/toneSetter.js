import { s3, R2_BUCKETS, validateR2Once, uploadBuffer, listKeys, getObjectAsText } from "../../r2-client.js";
// utils/toneSetter.js

const tones = [
  'Sarcastic',
  'Witty',
  'Dry as hell',
  'Skeptical',
  'Optimistic',
  'Casual',
  'Playful',
   'Bold',
  'Cautious',
  'Confident',
  'Inspirational',
  'Friendly',
  'Humorous'
];

export function getRandomTone() {
  const idx = Math.floor(Math.random() * tones.length);
  return tones[idx];
}

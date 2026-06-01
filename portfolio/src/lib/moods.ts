// Fixed mood palette for poems. Kept free of node imports so it's safe to use
// in client components. The classifier in scripts/generate-media.mjs uses the
// same list (keep them in sync).
export const MOODS = [
  "melancholy",
  "longing",
  "hope",
  "love",
  "peace",
  "restless",
  "dreamy",
  "self-love",
] as const;

export type Mood = (typeof MOODS)[number];

export const moodColor: Record<string, string> = {
  melancholy: "#8794b8",
  longing: "#b79ad0",
  hope: "#7fbf9e",
  love: "#e88aa6",
  peace: "#8fc1e0",
  restless: "#e0a36b",
  dreamy: "#c79ad8",
  "self-love": "#e0b85f",
};

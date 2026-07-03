// Every hand-written passage on the site, editable from the atelier (/edit).
// These are the repo defaults; overrides live in Blobs and win at render time.
// **wrapped** text renders bold where the page supports it.

export interface CopyBlock {
  page: string; // which page it appears on (also powers /<page>/edit)
  label: string; // short human label in the editor
  text: string;
  hint?: string;
}

export const copyDefaults: Record<string, CopyBlock> = {
  "home.greeting": {
    page: "home",
    label: "greeting line",
    text: "hi, the internet! welcome to my little corner 🧋",
  },
  "home.intro": {
    page: "home",
    label: "intro paragraph",
    text: "Teaching computers new tricks in New York 🗽 as a Data Scientist. When I'm not wrangling data, you'll find me writing poetry, chasing good light, and filling my camera roll faster than my storage can handle.",
  },
  "about.bio": {
    page: "about",
    label: "bio (blank line starts a new paragraph, **text** = bold)",
    text: [
      "I'm Rishika, a Data Science master's student at **Columbia University**. I spend my days building models, asking questions, and staring at plots until they either reveal something useful or make me question my life choices.",
      "I'm interested in machine learning, LLM systems, causal inference, and using data to understand complex problems in healthcare, public policy, and beyond. Before Columbia, I studied Computer Science and Data Science at VIT and worked as a software engineer.",
      'Most of my favorite projects begin with a simple thought: "I wonder if..." Unfortunately, that thought is usually followed by three weeks of research, six notebooks, and a new GitHub repository.',
      "This website is where those adventures end up.",
    ].join("\n\n"),
  },
  "work.intro": {
    page: "work",
    label: "intro ({count} becomes the live project count)",
    text: "{count} things I've grown, from clinical LLM systems to causal studies to weekend ML experiments. New projects sprout here on their own as I push them to GitHub. The big blooms are below; pick a patch to wander through the rest.",
  },
  "blog.intro": {
    page: "blog",
    label: "writing room intro",
    text: "Three little doors. One for curiosity, one for feelings, one for the moments I wanted to keep. They began as scattered notes, late-night thoughts, and photographs. Somehow, they all ended up here. ✨",
  },
  "blog.technical.intro": {
    page: "blog",
    label: "technical blogs tagline",
    text: "ideas that refused to stay inside a notebook 💡",
  },
  "contact.intro": {
    page: "contact",
    label: "contact intro",
    text: "Whether it's a role, a research idea, a poem you loved, or just a nice photo of the sky, my inbox is always open.",
  },
};

export type CopyMap = Record<string, string>;

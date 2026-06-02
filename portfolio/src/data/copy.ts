// Two voices for the same facts: a whimsical default and a recruiter-facing
// version that leads with role, scope, and metrics. Toggled site-wide by the
// ModeProvider. All facts here are grounded in the real bio and experience.

export const copy = {
  home: {
    greeting: {
      playful: "hi, the internet! welcome to my little corner ✦",
      recruiter: "Data Scientist · LLM systems · causal inference · applied ML",
    },
    bio: {
      playful:
        "Teaching computers new tricks in New York 🗽 as a Data Scientist. When I'm not wrangling data, you'll find me writing poetry, chasing good light, and filling my camera roll faster than my storage can handle.",
      recruiter:
        "Data Scientist in New York building LLM systems, causal inference, and production ML. MS in Data Science at Columbia University (GPA 3.87). Previously cut forecast error 23% across 12 business units and saved $100K+ at Shell, and shipped clinical-trial NLP at Novartis.",
    },
  },
  about: {
    recruiter: [
      "Rishika Mamidibathula is a Data Scientist completing an MS in Data Science at Columbia University (GPA 3.87), focused on machine learning, LLM systems, and causal inference.",
      "She currently builds clinical LLM phenotyping pipelines at Columbia University Irving Medical Center and evaluates human-rights LLMs at Columbia GSAS. As a Software Engineer at Shell she cut forecast error 23% across 12 business units and saved $100K+, and at Novartis she shipped clinical-trial NLP workflows.",
      "Her work spans healthcare, public policy, and high-performance ML, with an emphasis on rigorous evaluation and trustworthy, well-documented systems.",
    ],
  },
};

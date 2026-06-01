export type Entry = {
  icon: string;
  when: string;
  title: string;
  place: string;
  note: string;
  // extra highlights revealed when the card is clicked, add as many as you like
  details?: string[];
};

// Short first-person intro shown at the top of the About page.
export const bio: string[] = [
  "I'm Rishika, a Data Science master's student at Columbia University. I spend my days building models, asking questions, and staring at plots until they either reveal something useful or make me question my life choices.",
  "I'm interested in machine learning, LLM systems, causal inference, and using data to understand complex problems in healthcare, public policy, and beyond. Before Columbia, I studied Computer Science and Data Science at VIT and worked as a software engineer.",
  "Most of my favorite projects begin with a simple thought: \"I wonder if...\" Unfortunately, that thought is usually followed by three weeks of research, six notebooks, and a new GitHub repository.",
  "This website is where those adventures end up.",
];

export const timeline: Entry[] = [
  {
    icon: "🧸",
    when: "Summer 2026",
    title: "Data Science Intern",
    place: "NYC Administration for Children's Services",
    note: "Predictive risk models on child-welfare data with explainable ML, fairness auditing, and causal adjustment for high-stakes public-sector decisions.",
    details: [
      "Explainable ML on sensitive child-welfare data.",
      "Fairness auditing baked into every model.",
      "Causal adjustment for high-stakes public-sector decisions.",
    ],
  },
  {
    icon: "🏥",
    when: "Jan 2026 – Present",
    title: "Research Assistant: Clinical LLM & Phenotyping",
    place: "Columbia University Irving Medical Center",
    note: "An LLM pipeline that turns years of messy clinical notes into structured, research-ready data, with patient privacy and accuracy built in.",
    details: [
      "Built an end-to-end system that reads years of cardiology and rheumatology notes for a cohort of cardiac-sarcoidosis patients and extracts dozens of structured clinical variables.",
      "Reconstructed fragmented hospital records into clean, chronological patient timelines so the model could reason over how the disease and treatments evolved.",
      "Designed a HIPAA-safe de-identification step that strips out patient identifiers before anything reaches the model, with no protected data ever written to disk.",
      "Engineered safeguards so the model only captures facts that are explicitly stated, never guessing or filling in missing details.",
      "Validated the extracted data against blinded chart review by two clinicians to measure real-world accuracy.",
    ],
  },
  {
    icon: "⚖️",
    when: "Jan 2026 – Present",
    title: "Research Assistant: Human Rights LLM Evaluation",
    place: "Columbia GSAS",
    note: "An LLM framework that scores defense manufacturers on human-rights due diligence and checks its own judgments against expert raters.",
    details: [
      "Automated human-rights due-diligence scoring for 27 defense manufacturers, grounded in UN, UNICEF, and Arms Trade Treaty frameworks.",
      "Scored each company across nine dimensions, including a dedicated set of children's-rights criteria.",
      "Two-stage design so the model can't make things up: one stage gathers and quotes real evidence from company policy documents, a second stage scores it with transparent reasoning.",
      "Benchmarked the model's scores against expert human raters and reported how closely they agreed.",
      "Produced an auditable report where every score traces back to its source.",
    ],
  },
  {
    icon: "🐚",
    when: "2023 – 2025",
    title: "Software Engineer",
    place: "Shell, Bengaluru",
    note: "ML forecasting in Databricks across 12 business units.",
    details: [
      "23% lower forecast error across 12 business units.",
      "$100K+ in operational savings.",
      "RPA bots that cut manual reporting effort by 85%.",
    ],
  },
  {
    icon: "💊",
    when: "Jan – Jul 2023",
    title: "Technical Analyst Intern",
    place: "Novartis, Hyderabad",
    note: "NLP workflow for clinical-trial sentiment mining and summarization, plus time-series pipelines supporting a 19% carbon-reduction goal.",
    details: [
      "NLP for clinical-trial sentiment mining and summarization.",
      "Time-series pipelines supporting a 19% carbon-reduction goal.",
    ],
  },
  {
    icon: "📢",
    when: "Feb – Mar 2022",
    title: "Data Visualization Intern",
    place: "Saint Louis University",
    note: "Built Tableau dashboards to analyze campaign performance and guide resource allocation.",
    details: [
      "Tableau dashboards on campaign performance metrics.",
      "Insights that sharpened analysis and resource allocation.",
    ],
  },
];

export const education: Entry[] = [
  {
    icon: "🦁",
    when: "2025 – present",
    title: "M.S. in Data Science",
    place: "Columbia University, New York",
    note: "GPA 3.87, focus on machine learning, LLM systems, and causal inference.",
    details: [
      "**Coursework:** Applied Deep Learning, LLM-based Generative AI Systems, Causal Inference, High Performance Machine Learning, Machine Learning, Statistical Inference and Modelling, Exploratory Data Analysis and Visualization, and Agentic AI.",
      "Teaching Assistant for Artificial Intelligence for Public Policy at the Data Science Institute.",
      "DSI Student Council, Communications & Professional Resources.",
      "Research assistant on two LLM projects: clinical phenotyping and human-rights evaluation.",
    ],
  },
  {
    icon: "🎓",
    when: "2019 – 2023",
    title: "B.Tech, Computer Science & Data Science",
    place: "Vellore Institute of Technology (VIT)",
    note: "4.0/4.0 GPA · graduated ranked 7th of ~200 (top 4%).",
    details: [
      "Perfect 4.0/4.0 GPA, ranked 7th of ~200 (top 4%).",
      "Merit Scholarship recipient, 2019 to 2023, and Program Representative for all four years.",
      "**Data Science** coursework: Artificial Intelligence, Machine Learning, Deep Learning, Natural Language Processing, Image Processing, Predictive Analytics, Business Intelligence and Analytics, and Social and Information Networks.",
      "**Computer Science** coursework: Data Structures and Algorithms, Object-Oriented Programming, Database Management Systems, Operating Systems, Computer Architecture, Theory of Computation and Compiler Design, Network and Communication, Internet Programming and Web Technologies, Internet of Things, and Cryptography and Network Security.",
      "**Mathematics** coursework: Calculus, Applied Linear Algebra, Discrete Mathematics and Graph Theory, Statistics, and Differential Equations.",
    ],
  },
];

// High-level skill areas (mirrors the SkillGraph hubs) for grounding the chatbot.
export const skillAreas: string[] = [
  "Generative AI",
  "Agentic AI",
  "Natural Language Processing",
  "Causal Inference",
  "High Performance Machine Learning",
  "Deep Learning",
  "Machine Learning",
  "Statistical Modeling",
  "Computer Vision",
  "Web Development",
  "Data & Cloud",
  "Cybersecurity",
];

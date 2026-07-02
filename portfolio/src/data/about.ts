import type { Category, Domain } from "@/data/projects";

export type Entry = {
  icon: string;
  when: string;
  title: string;
  place: string;
  note: string;
  // extra highlights revealed when the card is clicked, add as many as you like
  details?: string[];
  // same chips as project cards: colored domain + mint tech area
  domains?: Domain[];
  tech?: Category[];
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
    domains: ["Public Sector", "Human Rights"],
    tech: ["Machine Learning", "Causal Inference"],
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
    domains: ["Healthcare"],
    tech: ["Generative AI", "NLP"],
    details: [
      "Built an end-to-end system that reads years of cardiology and rheumatology notes for a cohort of cardiac-sarcoidosis patients and extracts dozens of structured clinical variables.",
      "Reconstructed fragmented hospital records into clean, chronological patient timelines so the model could reason over how the disease and treatments evolved.",
      "Designed a HIPAA-safe de-identification step that strips out patient identifiers before anything reaches the model, with no protected data ever written to disk.",
      "Engineered safeguards so the model extracts only explicitly stated facts, without inferring or imputing missing values.",
      "Validated the extracted data against blinded chart review by two clinicians to measure real-world accuracy.",
    ],
  },
  {
    icon: "⚖️",
    when: "Jan 2026 – Present",
    title: "Research Assistant: Human Rights LLM Evaluation",
    place: "Columbia GSAS",
    note: "An LLM framework that scores defense manufacturers on human-rights due diligence and checks its own judgments against expert raters.",
    domains: ["Human Rights", "Legal"],
    tech: ["Generative AI"],
    details: [
      "Automated human-rights due-diligence scoring for 27 defense manufacturers, grounded in UN, UNICEF, and Arms Trade Treaty frameworks.",
      "Scored each company across nine dimensions, including a dedicated set of children's-rights criteria.",
      "Designed a two-stage, evidence-grounded pipeline: the first stage retrieves and quotes source text from company policy documents, and the second scores it with transparent, auditable reasoning.",
      "Benchmarked the model's scores against expert human raters and reported how closely they agreed.",
      "Produced an auditable report where every score traces back to its source.",
    ],
  },
  {
    icon: "🐚",
    when: "2023 – 2025",
    title: "Software Engineer",
    place: "Shell, Bengaluru",
    note: "Built and deployed machine-learning forecasting pipelines in Databricks across 12 business units.",
    tech: ["Predictive Analysis", "Machine Learning"],
    details: [
      "Designed and shipped ML forecasting models in Databricks across 12 business units, cutting forecast error by 23%.",
      "Drove over $100K in operational savings through improved demand forecasting and process automation.",
      "Built RPA bots that automated recurring reporting, cutting manual effort by 85%.",
      "Partnered with business stakeholders to translate forecasts into planning and resource decisions.",
    ],
  },
  {
    icon: "💊",
    when: "Jan – Jul 2023",
    title: "Technical Analyst Intern",
    place: "Novartis, Hyderabad",
    note: "Built NLP and time-series workflows supporting clinical-trial analysis and sustainability goals.",
    domains: ["Healthcare"],
    tech: ["NLP", "Predictive Analysis"],
    details: [
      "Developed an NLP workflow to mine and summarize sentiment from clinical-trial text at scale.",
      "Built time-series pipelines that informed operations toward a 19% carbon-reduction goal.",
      "Delivered analyses that fed into cross-functional decision-making.",
    ],
  },
  {
    icon: "📢",
    when: "Feb – Mar 2022",
    title: "Data Visualization Intern",
    place: "Saint Louis University",
    note: "Built Tableau dashboards to analyze campaign performance and guide resource allocation.",
    domains: ["Education"],
    tech: ["Statistical Modeling"],
    details: [
      "Designed Tableau dashboards tracking campaign-performance metrics across channels.",
      "Surfaced insights that sharpened analysis and guided how resources were allocated.",
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
      "Merit Scholarship recipient and Program Representative, 2019 to 2023.",
      "**Data Science coursework:** Artificial Intelligence, Machine Learning, Deep Learning, Natural Language Processing, Image Processing, Predictive Analytics, Business Intelligence and Analytics, and Social and Information Networks.",
      "**Computer Science coursework:** Data Structures and Algorithms, Object-Oriented Programming, Database Management Systems, Operating Systems, Computer Architecture, Theory of Computation and Compiler Design, Network and Communication, Internet Programming and Web Technologies, Internet of Things, and Cryptography and Network Security.",
      "**Mathematics coursework:** Calculus, Applied Linear Algebra, Discrete Mathematics and Graph Theory, Statistics, and Differential Equations.",
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

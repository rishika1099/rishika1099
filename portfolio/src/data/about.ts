import type { Category, Domain } from "@/data/projects";

// a file pinned to an entry (a certificate image, a diploma PDF, etc.).
// Bytes live in the "attachments" blob store; the URL is /api/attachment/<id>.
export type Attachment = {
  id: string;
  name: string;
  kind: "image" | "pdf";
};

export type Entry = {
  icon: string;
  when: string;
  title: string;
  // a second line under the title, for the part of a name that is not the name:
  // "Bachelor of Technology" on top, "Computer Science & Data Science" beneath
  subtitle?: string;
  place: string;
  note: string;
  // extra highlights revealed when the card is clicked. Legacy entries store one
  // string per bullet; the editor now writes a single rich-HTML block instead.
  details?: string[] | string;
  // same chips as project cards: colored domain + mint tech area
  domains?: Domain[];
  tech?: Category[];
  // uploaded pictures / PDFs shown on the card
  attachments?: Attachment[];
  // a company or school mark, shown in place of the emoji when one is uploaded
  logo?: Attachment;
  // which cluster this belongs to. Work and research share one array, and the
  // section used to be read off the title: a card whose name said "Research
  // Assistant" was research. That meant renaming a card silently moved it, so
  // the section is stored instead. Absent on entries saved before that, which
  // fall back to the old rule.
  section?: "work" | "research";
};

// The bio now lives in src/data/copy.ts (editable in the atelier).

export const timeline: Entry[] = [
  {
    icon: "🧸",
    when: "Summer 2026",
    title: "Data Science Intern",
    section: "work",
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
    section: "research",
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
    section: "research",
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
    section: "work",
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
    section: "work",
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
    section: "work",
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

// Short courses, nanodegrees, and certifications. Starts empty; filled in from
// the /about/edit room.
export const certifications: Entry[] = [];

// Courses she has taught as a TA, listed with what each covers, in the same
// "**Topics:**" form the degree cards use for coursework. Taken from the
// courses' own pages rather than written from memory: the NLP schedule is
// Hewitt's lecture list, the policy course its directory description.
//
// These are the defaults. A saved About override that predates this section
// falls back to them rather than to an empty list, so they appear without a
// write to the live data, and once she edits the section in the atelier the
// saved copy takes over.
export const teaching: Entry[] = [
  {
    icon: "💬",
    when: "Fall 2026",
    title: "Natural Language Processing",
    subtitle: "Teaching Assistant, COMS 4705",
    place:
      'Columbia University, Computer Science, taught by <a href="https://www.cs.columbia.edu/~johnhew/coms4705/index.html" target="_blank" rel="noopener noreferrer">John Hewitt</a>',
    note: "From tokenization and transformers through RLHF, agents and interpretability.",
    details: [
      "**Foundations:** language modeling, tokenization, and representation learning, from architectures to how they learn.",
      "**Transformers:** self-attention, GPUs and parallelizable architectures, pretraining, and finetuning and sampling.",
      "**Alignment and agents:** instruction following and RLHF, RLVR and agent alignment, and retrieval and tools.",
      "**Evaluation and responsibility:** tasks and evaluation, experimental design, AI safety, bias, fairness and privacy, and interpretability and analysis.",
      "**Also:** building a machine translation system, diffusion models, and the history of NLP.",
    ],
    tech: ["NLP", "Generative AI", "Deep Learning"],
  },
  {
    icon: "🏛️",
    when: "Spring 2026",
    title: "Artificial Intelligence for Public Policy",
    subtitle: "Teaching Assistant",
    place: "Columbia University, School of International and Public Affairs (SIPA)",
    note: "AI fundamentals for policy students, and how to turn a policy problem into an AI solution.",
    details: [
      "**Foundations:** the fundamentals of AI, and the mathematical and programming principles behind common machine learning algorithms for prediction, classification and clustering.",
      "**In practice:** applications of AI across business, non-profits and government, and its implications for the future of governance.",
      "**Concept to Implementation:** student groups identify a public policy problem, work through the data and algorithmic considerations, and propose an AI-driven solution.",
    ],
    tech: ["Machine Learning"],
    domains: ["Public Sector"],
  },
];

// Volunteering: councils, employee networks and causes she has given time to,
// newest first. Worded from her own LinkedIn entries.
//
// The marks are the logos already uploaded to the live About cards (Columbia,
// Shell and VIT), so these arrive with them. Where a logo is missing, as in
// local dev, the card shows its emoji instead.
//
// Like teaching, a saved override from before this section reads back as these
// defaults, so they appear on deploy without a write to the live data.
export const volunteering: Entry[] = [
  {
    icon: "🗳️",
    when: "Sep 2025 to present",
    title: "Student Council Voting Member",
    place: "Data Science Institute, Columbia University",
    logo: { id: "2e443c9a61524e7ea361", name: "columbia.jpg", kind: "image" },
    note: "A voting member of the DSI student council, in its Communications & Professional Resources and Social departments. Connects students with internships, research openings, networking events and career resources.",
    details: [
      "Promoting council initiatives across the DSI community.",
      "Helping students stay informed, build meaningful connections, and make the most of their time at Columbia.",
      // written as HTML throughout: a string holding a tag is not run through
      // the **bold** shorthand, so the label would have shown its asterisks
      '<strong>Built for it:</strong> the <a href="https://dsi-course-evaluation.streamlit.app/" target="_blank" rel="noopener noreferrer">DSI Course Evaluation website</a>, a course decision dashboard for Columbia MSDS students.',
    ],
  },
  {
    icon: "🌈",
    when: "Aug 2023 to Jul 2025",
    title: "LGBTQIA+ Volunteer",
    place: "Shell",
    logo: { id: "61df9f8a39744f9eacfb", name: "Color-Shell-Logo.jpg", kind: "image" },
    note: "A member of Shell's LGBTQ+ network, promoting inclusivity across the organization. Helped organize events, workshops and discussions for LGBTQ+ employees, and worked for policies that represented diverse perspectives.",
    details: [
      "Helped organize events, workshops and discussions that made Shell a more supportive place for LGBTQ+ employees.",
      "Worked to make policies and practices inclusive and representative of diverse perspectives.",
      "Part of building an open, welcoming culture at Shell.",
    ],
  },
  {
    icon: "♿",
    when: "Aug 2023 to Jul 2025",
    title: "enABLE Networks Volunteer",
    place: "Shell",
    logo: { id: "61df9f8a39744f9eacfb", name: "Color-Shell-Logo.jpg", kind: "image" },
    note: "Part of Shell's enABLE network, raising awareness of the needs of employees with disabilities. Helped organize events on accessibility challenges, and advocated for policies that gave colleagues the support they needed.",
    details: [
      "Helped organize events and initiatives that improved understanding of accessibility challenges.",
      "Advocated for policies and practices that gave employees with disabilities the resources and support they needed.",
      "Part of making Shell a more accessible and supportive workplace for everyone.",
    ],
  },
  {
    icon: "🙋",
    when: "Jul 2020 to Jun 2023",
    title: "Program Representative",
    place: "Vellore Institute of Technology",
    logo: { id: "e11a9fb7d5494af699f1", name: "vit.jpeg", kind: "image" },
    note: "Three years as the link between the students and faculty of her program. Resolved academic concerns quickly, shared feedback that shaped the curriculum, mentored junior students and organized events for the cohort.",
    details: [
      "Kept communication open between students and faculty, and resolved academic concerns quickly.",
      "Shared student feedback to improve the curriculum, and mentored junior students.",
      "Organized events that brought the program together and built a strong sense of community.",
    ],
  },
  {
    icon: "🌱",
    when: "Aug 2020 to Apr 2021",
    title: "Student Assistant",
    place: "Ayuda NGO",
    note: "Volunteered on initiatives for underprivileged children and marginalized communities, helping organize community outreach programs, fundraising efforts and awareness campaigns.",
    details: [
      "Helped organize community outreach programs, fundraising efforts and awareness campaigns.",
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
      "Merit Scholarship recipient, 2019 to 2023.",
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

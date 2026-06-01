export type Category =
  | "Generative AI"
  | "Agentic AI"
  | "NLP"
  | "Causal Inference"
  | "Statistical Modeling"
  | "Machine Learning"
  | "Predictive Analysis"
  | "Deep Learning"
  | "Computer Vision"
  | "High Performance Machine Learning"
  | "Cybersecurity";

export type Domain =
  | "Healthcare"
  | "Education"
  | "Public Sector"
  | "Legal"
  | "Human Rights"
  | "Finance"
  | "Cybersecurity"
  | "Agriculture"
  | "Food & Nutrition"
  | "Social Media";

export interface Project {
  name: string;
  emoji: string;
  blurb: string;
  // a project can live in more than one category (they overlap)
  categories: Category[];
  domains?: Domain[];
  featured?: boolean;
  repo: string;
  demo?: string;
  tags: string[];
}

const gh = (slug: string) => `https://github.com/rishika1099/${slug}`;

export const projects: Project[] = [
  // ---------------- Featured ----------------
  {
    name: "Folio: Clinical Multimodal RAG",
    emoji: "🩺",
    blurb:
      "A multimodal medical-record companion unifying RAG, document understanding, speech, and vision. Consensus extraction across LLMs hit 85.1% micro-F1 with sub-2s latency.",
    categories: ["Generative AI", "Computer Vision"],
    domains: ["Healthcare"],
    featured: true,
    repo: gh("Folio-Clinical-Multimodal-RAG"),
    demo: "https://folio-health.vercel.app",
    tags: ["RAG", "Multimodal", "FastAPI", "React", "MongoDB"],
  },
  {
    name: "KV-Cache Optimization for LLM Inference",
    emoji: "⚡",
    blurb:
      "Benchmarked KIVI quantization, TopK sparsity, SnapKV eviction & MLA on Llama-2-7B with Triton kernels, 4× cache compression, 1.93× faster decode, 3.1× peak throughput.",
    categories: ["High Performance Machine Learning"],
    featured: true,
    repo: gh("KV-Cache-Optimization"),
    demo: "https://rishika1099.substack.com/p/kv-cache-optimization",
    tags: ["LLM Systems", "Triton", "Quantization", "HPC"],
  },
  {
    name: "Colon Cancer Trial Causal Analysis",
    emoji: "🧬",
    blurb:
      "Causal re-analysis of the Moertel 1990 trial (n=929): ATE, CATE, mediation, transport. Showed collider bias reversing the effect (HR 0.69 → 1.10).",
    categories: ["Causal Inference", "Statistical Modeling"],
    domains: ["Healthcare"],
    featured: true,
    repo: gh("Colon-Cancer-Trial-Causal-Analysis"),
    tags: ["Causal Inference", "Biostatistics", "R"],
  },
  {
    name: "Federal Eagle: AI Legal Assistant",
    emoji: "🦅",
    blurb:
      "A multi-agent CrewAI system for U.S. federal legal analysis: semantic USC retrieval, precedent search, elements analysis, and draft generation.",
    categories: ["Agentic AI", "Generative AI"],
    domains: ["Legal"],
    featured: true,
    repo: gh("Federal-Eagle-AI-Legal-Assistant"),
    demo: "https://federal-eagle.streamlit.app/",
    tags: ["Multi-Agent", "CrewAI", "RAG"],
  },
  {
    name: "Just Ask Coach: NL → SQL",
    emoji: "🏅",
    blurb:
      "Full-stack RAG pipeline turning natural language into SQL and visualizations for sports performance analytics.",
    categories: ["Generative AI", "NLP"],
    featured: true,
    repo: gh("Just-Ask-Coach-Query-SQL-Translation"),
    demo: "https://just-ask-coach.netlify.app/",
    tags: ["Text-to-SQL", "ChromaDB", "Claude", "React"],
  },
  {
    name: "Ruchi: Pantry-to-Plate Intelligence",
    emoji: "🍲",
    blurb:
      "AI food app for video-to-recipe extraction, pantry matching, and personalized health coaching. React + Vite + Framer Motion on Netlify.",
    categories: ["Generative AI"],
    domains: ["Food & Nutrition"],
    featured: true,
    repo: gh("Ruchi-Pantry-to-Plate-Intelligence-Platform"),
    demo: "https://ruchi-app.netlify.app",
    tags: ["LLM", "React", "Serverless"],
  },

  // ---------------- The rest ----------------
  {
    name: "ReelChef: Video to Recipe",
    emoji: "🎬",
    blurb:
      "Converts cooking videos into structured recipes via a multi-stage vision-language pipeline: frame extraction, visual understanding, LLM reasoning.",
    categories: ["Generative AI", "Computer Vision"],
    domains: ["Food & Nutrition"],
    repo: gh("Reel-Chef-Video-To-Recipie-Extractor"),
    demo: "https://reel-chef.streamlit.app/",
    tags: ["Vision-Language", "LLM"],
  },
  {
    name: "DSI Course Evaluation",
    emoji: "📚",
    blurb:
      "Student-built dashboard for Columbia MSDS course reviews, live Google-Sheets data, AI-summarized reviews, rankings, and side-by-side comparisons.",
    categories: ["Generative AI", "NLP"],
    domains: ["Education"],
    repo: gh("DSI-Course-Evaluation-Website"),
    demo: "https://dsi-course-evaluation.streamlit.app/",
    tags: ["Streamlit", "LLM Summaries"],
  },
  {
    name: "Prescribed Motion",
    emoji: "🏃‍♀️",
    blurb:
      "AI coaching that maps fitness queries to personalized exercises via two-stage retrieval + LLM re-ranking. FastAPI, PostgreSQL, Claude.",
    categories: ["Generative AI"],
    domains: ["Healthcare"],
    repo: gh("Prescribed-Motion-Exercise-Recommendation-LLM"),
    demo: "https://prescribed-motion.netlify.app",
    tags: ["Retrieval", "FastAPI", "Claude"],
  },
  {
    name: "Hey Swiftie: Emotion Verse",
    emoji: "🎶",
    blurb:
      "AI diary turning journal entries into personalized verses + music recs. DistilRoBERTa emotion, K-Means over 867 songs, FAISS RAG, GPT-4o-mini.",
    categories: ["NLP", "Generative AI"],
    domains: ["Social Media"],
    repo: gh("Hey-Swiftie-Cluster-Emotion-Verse"),
    demo: "https://dear-diary-love-taylor.vercel.app/",
    tags: ["Emotion AI", "FAISS", "Clustering"],
  },
  {
    name: "Ghost Writer: AI Blog Assistant",
    emoji: "👻",
    blurb:
      "AI blog-post generator with DALL·E images, SEO-optimized content with customizable tone, length, and generated visuals.",
    categories: ["Generative AI"],
    domains: ["Social Media"],
    repo: gh("Ghost-Writer-AI-Blog-Assistant"),
    demo: "https://ghost-writer-ai.streamlit.app/",
    tags: ["Generative AI", "DALL·E"],
  },
  {
    name: "Dr. Pixel: Medical Image Assistant",
    emoji: "🔬",
    blurb:
      "Educational medical-image analysis with Gemini Vision, upload or camera capture, safe non-diagnostic insights with built-in disclaimers.",
    categories: ["Computer Vision", "Generative AI"],
    domains: ["Healthcare"],
    repo: gh("Dr-Pixel-Medical-Image-Analysis-Assistant"),
    demo: "https://doctor-pixel.streamlit.app/",
    tags: ["Vision", "Gemini"],
  },
  {
    name: "Analogy Tutor",
    emoji: "💡",
    blurb:
      "Explains technical concepts through personalized analogies based on your interests. Interactive and friendly.",
    categories: ["Generative AI"],
    domains: ["Education"],
    repo: gh("Analogy-Tutor"),
    demo: "https://ai-concept-tutor.streamlit.app/",
    tags: ["LLM", "Education"],
  },
  {
    name: "Safe Start: Child Welfare Prediction",
    emoji: "🧒",
    blurb:
      "ML & predictive analytics framework for identifying high-risk child-welfare cases using NCANDS data.",
    categories: ["Causal Inference", "Predictive Analysis", "Machine Learning"],
    domains: ["Public Sector", "Human Rights"],
    repo: gh("Safe-Start-NCANDS-Child-Welfare-Prediction"),
    tags: ["Predictive", "Public Policy"],
  },
  {
    name: "Colorectal Cancer Risk Analysis",
    emoji: "🥗",
    blurb:
      "Visual analysis of how diet and lifestyle contribute to colorectal cancer risk, built in R/Shiny.",
    categories: ["Statistical Modeling"],
    domains: ["Healthcare"],
    repo: gh("Colorectal-Cancer-Risk-Analysis"),
    demo: "https://rishika1099.shinyapps.io/colorectal_cancer_risk_analysis/",
    tags: ["R", "Shiny", "EDA"],
  },
  {
    name: "Keratoconus Detection",
    emoji: "👁️",
    blurb: "Automated keratoconus detection using SVM and deep neural networks.",
    categories: ["Computer Vision", "Deep Learning"],
    domains: ["Healthcare"],
    repo: gh("Keratoconus-Detection"),
    tags: ["CNN", "Medical Imaging"],
  },
  {
    name: "Kidney Disorder Detection",
    emoji: "🫘",
    blurb:
      "Classifies CT scans into Normal/Cyst/Stone/Tumor via VGG19 & ResNet50 transfer learning, 99.2% accuracy.",
    categories: ["Computer Vision", "Deep Learning"],
    domains: ["Healthcare"],
    repo: gh("Kidney-Disorder-Detection"),
    tags: ["Transfer Learning", "ResNet"],
  },
  {
    name: "Cataract Detection",
    emoji: "🩻",
    blurb: "Automated cataract detection using CNNs and transfer learning.",
    categories: ["Computer Vision", "Deep Learning"],
    domains: ["Healthcare"],
    repo: gh("Cataract-Detection"),
    tags: ["CNN", "Medical Imaging"],
  },
  {
    name: "Traffic Sign Classifier",
    emoji: "🚸",
    blurb:
      "VGG16 transfer learning + fine-tuning on GTSRB, 98% accuracy across 43 classes.",
    categories: ["Computer Vision", "Deep Learning"],
    repo: gh("Traffic-Sign-Classifier"),
    tags: ["VGG16", "Classification"],
  },
  {
    name: "Plant Disease Detection",
    emoji: "🌿",
    blurb:
      "ResNet50 transfer learning across 38 plant-disease classes with training, evaluation, and inference tools.",
    categories: ["Computer Vision", "Deep Learning"],
    domains: ["Agriculture"],
    repo: gh("Plant-Disease-Detection"),
    tags: ["ResNet50", "Agriculture"],
  },
  {
    name: "Car Price Prediction",
    emoji: "🚗",
    blurb:
      "Predicts used-car prices (India), 65.6% R² with XGBoost + Optuna, SHAP explainability across 4 ensembles.",
    categories: ["Predictive Analysis", "Machine Learning"],
    domains: ["Finance"],
    repo: gh("Car-Price-Prediction"),
    tags: ["XGBoost", "SHAP", "Optuna"],
  },
  {
    name: "Red Wine Quality Prediction",
    emoji: "🍷",
    blurb:
      "Gradient Boosting on physicochemical properties with SHAP, feature importance, and PDPs for interpretability.",
    categories: ["Machine Learning"],
    domains: ["Food & Nutrition"],
    repo: gh("Red-Wine-Quality-Prediction"),
    tags: ["Gradient Boosting", "SHAP"],
  },
  {
    name: "Loan Status Prediction",
    emoji: "🏦",
    blurb:
      "Production-style pipeline + Gradient Boosting for loan approval with SHAP explanations and an interactive UI.",
    categories: ["Predictive Analysis", "Machine Learning"],
    domains: ["Finance"],
    repo: gh("Loan-Status-Prediction"),
    tags: ["Pipelines", "SHAP"],
  },
  {
    name: "Fake News Detection",
    emoji: "📰",
    blurb:
      "TF-IDF + Linear SVM on the WELFake dataset with a real-time credibility-prediction interface.",
    categories: ["NLP"],
    repo: gh("Fake-News-Detection"),
    tags: ["NLP", "SVM", "TF-IDF"],
  },
  {
    name: "House Price Prediction",
    emoji: "🏡",
    blurb:
      "XGBoost regression on California housing with an interactive what-if explorer.",
    categories: ["Predictive Analysis", "Machine Learning"],
    domains: ["Finance"],
    repo: gh("House-Price-Prediction"),
    tags: ["XGBoost", "Regression"],
  },
  {
    name: "Diabetes Risk Prediction",
    emoji: "🩸",
    blurb:
      "Gradient Boosting on clinical indicators with SHAP for global and per-patient explanations.",
    categories: ["Predictive Analysis", "Machine Learning"],
    domains: ["Healthcare"],
    repo: gh("Diabetes-Risk-Prediction"),
    tags: ["Gradient Boosting", "SHAP"],
  },
  {
    name: "Rock vs. Mine Prediction",
    emoji: "🪨",
    blurb:
      "Classifies sonar signals as rock or mine via cross-validated automated model selection.",
    categories: ["Machine Learning"],
    repo: gh("Rock-Mine-Prediction"),
    tags: ["Classification", "Model Selection"],
  },
  {
    name: "Customer Churn Prediction",
    emoji: "🛍️",
    blurb:
      "Predicts repeat-purchase behavior for food-delivery businesses and surfaces key retention drivers.",
    categories: ["Predictive Analysis", "Machine Learning"],
    domains: ["Food & Nutrition"],
    repo: gh("Customer-Churn-Prediction"),
    tags: ["Churn", "Retention"],
  },
  {
    name: "Heart Disease Prediction",
    emoji: "❤️",
    blurb:
      "EDA, feature engineering, SMOTE for imbalance, and tuned models exploring heart-disease risk factors.",
    categories: ["Predictive Analysis", "Machine Learning"],
    domains: ["Healthcare"],
    repo: gh("Heart-Disease-Prediction"),
    tags: ["SMOTE", "Tuning"],
  },
  {
    name: "Android Malware Analysis",
    emoji: "🤖",
    blurb:
      "Deep neural networks combining static + dynamic analysis to detect malicious Android apps.",
    categories: ["Cybersecurity", "Deep Learning"],
    domains: ["Cybersecurity"],
    repo: gh("Android-Malware-Analysis"),
    tags: ["Security", "Deep Learning"],
  },
  {
    name: "Blockchain Secure Data Storage",
    emoji: "🔗",
    blurb:
      "Secure storage of encrypted medical/review data using ECDSA signatures, Proof of Work, and hash chaining.",
    categories: ["Cybersecurity"],
    domains: ["Cybersecurity"],
    repo: gh("Blockchain-Secure-Data-Storage"),
    tags: ["Blockchain", "Cryptography"],
  },
];

export const categories: Category[] = [
  "Generative AI",
  "Agentic AI",
  "NLP",
  "Causal Inference",
  "Statistical Modeling",
  "Machine Learning",
  "Predictive Analysis",
  "Deep Learning",
  "Computer Vision",
  "High Performance Machine Learning",
  "Cybersecurity",
];

export const domains: Domain[] = [
  "Healthcare",
  "Education",
  "Public Sector",
  "Legal",
  "Human Rights",
  "Finance",
  "Cybersecurity",
  "Agriculture",
  "Food & Nutrition",
  "Social Media",
];

// Soft pastel chip colors (paired with dark text for readability).
export const domainColor: Record<Domain, string> = {
  Healthcare: "#f6c9d5",
  Education: "#c5e0f5",
  "Public Sector": "#ddcbb8",
  Legal: "#ccd3f2",
  "Human Rights": "#e0cdf2",
  Finance: "#bfe3d2",
  Cybersecurity: "#d4d7dd",
  Agriculture: "#d9eab0",
  "Food & Nutrition": "#f8d4bd",
  "Social Media": "#f0c8e8",
};

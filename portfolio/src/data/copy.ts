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
  "work.galaxy.title": { page: "work", label: "embeddings galaxy heading", text: "🌌 the embeddings galaxy" },
  "work.galaxy.intro": {
    page: "work",
    label: "embeddings galaxy intro",
    text: "every project embedded and projected to 2D, so similar work sits close together. drop in something you care about and see where <em>you</em> land.",
  },
  "work.galaxy.placeholder": { page: "work", label: "galaxy input placeholder", text: "e.g. real-time ML on tiny devices" },
  "work.galaxy.cta": { page: "work", label: "galaxy submit button", text: "drop me in" },
  "work.galaxy.examples": {
    page: "work",
    label: "galaxy example chips (comma-separated)",
    text: "making LLMs run faster, computer vision on medical images, fairness in high-stakes decisions, causal inference, something with agents",
  },
  "work.galaxy.hint": {
    page: "work",
    label: "galaxy footnote",
    text: "Embedded with OpenAI, projected to 2D with PCA, colored by technical area. Your star is the same query embedding projected into the very same axes.",
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
  "photography.intro": {
    page: "photography",
    label: "photography tagline",
    text: "sunsets, sidewalks, and other things that caught my eye ✨",
  },
  "contact.intro": {
    page: "contact",
    label: "contact intro",
    text: "Whether it's a role, a research idea, a poem you loved, or just a nice photo of the sky, my inbox is always open.",
  },
  "blog.door.technical": { page: "blog", label: "technical door blurb", text: "ideas that refused to stay inside a notebook 💡" },
  "blog.door.poems": { page: "blog", label: "poems door blurb", text: "a collection of midnight thoughts and daylight edits ☁️" },
  "blog.door.photography": { page: "blog", label: "photography door blurb", text: "sunsets, sidewalks, and other things that caught my eye ✨" },
  "now.intro": { page: "now", label: "intro line", text: 'a living snapshot, inspired by the <a href="https://nownownow.com/about" target="_blank" rel="noreferrer">/now page</a> idea. last tended: June 2026 ✦' },
  "now.working": { page: "now", label: "🌱 working on", text: "<p>Data Science Intern at NYC Administration for Children's Services: explainable risk models with fairness auditing for child-welfare decisions.</p><p>Research at Columbia Irving Medical Center: an LLM pipeline that turns messy clinical notes into structured, research-ready data.</p><p>Research at Columbia GSAS: an LLM framework that scores defense manufacturers on human-rights due diligence.</p>" },
  "now.learning": { page: "now", label: "📚 learning", text: "<p>M.S. in Data Science at Columbia: deep learning, LLM systems, causal inference, and high-performance ML.</p><p>Making LLM systems measurable: evals, grounding, and honest confidence.</p>" },
  "now.tinkering": { page: "now", label: "🛠️ tinkering", text: "<p>This site! Latest experiments: an embedding zero-shot blog tagger, tiny privacy-friendly analytics, and a secret editing atelier.</p><p>Writing technical deep-dives on Substack (KV-cache optimization, causation vs prediction, image encryption).</p>" },
  "now.offclock": { page: "now", label: "🍵 off the clock", text: "<p>Writing poems (they live behind a little locked door on this site).</p><p>Chasing good light around New York with my camera.</p><p>Too much chai. No regrets.</p>" },
  "now.tools": { page: "now", label: "tools (comma-separated)", text: "Python, PyTorch, SQL, Databricks, OpenAI API, Next.js, TypeScript, Tableau" },
  // ---- page titles & headings (editable everywhere) ----
  "home.name1": { page: "home", label: "name, line 1", text: "Rishika" },
  "home.name2": { page: "home", label: "name, line 2", text: "Mamidibathula" },
  "about.title": { page: "about", label: "page title", text: "the human behind the models 🦦" },
  "about.heading.education": { page: "about", label: "education heading", text: "where curiosity took me 🎓" },
  "about.heading.skills": { page: "about", label: "skills heading", text: "things I tinker with 🛠️" },
  "about.heading.skills.sub": { page: "about", label: "skills subtitle", text: "little clusters of tools, all tangled together ✦" },
  "about.heading.work": { page: "about", label: "work heading", text: "where curiosity paid the bills 💼" },
  "about.heading.research": { page: "about", label: "research heading", text: "where curiosity became research 🔬" },
  "about.heading.certifications": { page: "about", label: "certifications heading", text: "where curiosity earned its stripes 📜" },
  "resume.subtitle": { page: "about", label: "printable resume subtitle line", text: "Data Scientist & ML Engineer · New York City" },
  "work.title": { page: "work", label: "page title", text: "my little meadow of projects 🌱" },
  "blog.title": { page: "blog", label: "writing room title", text: "the writing room 📖" },
  "blog.technical.title": { page: "blog", label: "technical blogs title", text: "technical blogs 📓" },
  "photography.title": { page: "photography", label: "page title", text: "photography 📷" },
  "contact.title": { page: "contact", label: "page title", text: "let's say hello 💌" },
  "contact.form.title": { page: "contact", label: "message form heading", text: "send me a message 💌" },
  "contact.form.private": { page: "contact", label: "message form privacy note", text: "📮 just between us · goes straight to my inbox, never shown here" },
  "contact.form.placeholder.message": { page: "contact", label: "message box placeholder", text: "say hi, share an idea, or a poem you loved…" },
  "contact.form.send": { page: "contact", label: "message send button", text: "send ✦" },
  "contact.form.sent": { page: "contact", label: "message sent confirmation", text: "thank you, your note is on its way ✦" },
  "contact.guestbook.title": { page: "contact", label: "guestbook heading", text: "📖 sign the guestbook" },
  "contact.guestbook.public": { page: "contact", label: "guestbook public-wall badge", text: "🌸 public wall · everyone who visits sees this" },
  "contact.guestbook.hint": { page: "contact", label: "guestbook sub-note", text: "leave a little note, it gets a mood ✦ (a model reads the vibe, not you)" },
  "contact.guestbook.placeholder.name": { page: "contact", label: "guestbook name placeholder", text: "your name (optional)" },
  "contact.guestbook.placeholder.note": { page: "contact", label: "guestbook note placeholder", text: "say hi…" },
  "contact.guestbook.empty": { page: "contact", label: "guestbook empty state", text: "no notes yet, be the first to pin one up ✦" },
  "now.title": { page: "now", label: "page title", text: "what i'm up to, now 🧭" },
  "poems.title": { page: "poems", label: "page title", text: "poems 🕯️" },
  "tour.title": { page: "tour", label: "article title", text: "The Data Science Hiding in My Portfolio" },
  // ---- the under-the-hood tour article (page: tour) ----
  "tour.hero": { page: "tour", label: "hero subtitle", text: "This site isn't just a static page. Most of it is generated, organized, and answered by models, and every piece ships with an eval. Here's the tour, with the concepts explained." },
  "tour.lead": { page: "tour", label: "lead paragraph", text: "The content on this site is not only displayed, a lot of it is generated, organized, and answered by models. And because I care whether each piece actually works, almost every one ships with a small <strong>evaluation</strong>, so quality is measured, not assumed. Here is how each part works, with the concept behind it." },
  "tour.embed.concept": { page: "tour", label: "embeddings concept box", text: "<p>An <strong>embedding</strong> turns text (or an image) into a list of numbers, a vector. A good model places similar meanings close together, even with no shared words: \"make LLMs faster\" and \"reduce inference latency\" land near each other.</p><p>To measure \"close\" I use <strong>cosine similarity</strong>: the cosine of the angle between two vectors, from -1 (opposite) through 0 (unrelated) to 1 (identical). It cares about direction, not length, so a short phrase and a long paragraph on the same topic still match.</p>" },
  "tour.embed.body": { page: "tour", label: "embeddings body", text: "Once meaning becomes geometry, a lot gets simple: search is \"find the nearest vectors,\" recommendations are \"find neighbors,\" classification is \"which label is closest.\" Almost everything below is a variation on that move." },
  "tour.rag.concept": { page: "tour", label: "RAG concept box", text: "<strong>Retrieval-augmented generation</strong> fixes the fact that LLMs confidently make things up. Instead of asking the model to recall facts, you retrieve the relevant source text first (by embedding similarity), then ask it to answer using only that text. It becomes a careful summarizer of real sources, not a fuzzy memory." },
  "tour.rag.grounded": { page: "tour", label: "RAG grounding", text: "Grounded in my bio, experience, every project's GitHub README, and my Substack posts (poems and photos are private and excluded). Answers stream token-by-token, cite sources, and refuse when out of scope." },
  "tour.rag.memory": { page: "tour", label: "RAG memory", text: "It also carries <strong>conversation memory</strong>: recent turns travel with each question, both into retrieval (the last exchange is embedded alongside the new question) and into the prompt, so a follow-up like \"can I see a demo of it?\" still knows what \"it\" is. And every project card has an <strong>ask about this</strong> button that opens the chat pre-loaded with that project, retrieval and grounding included." },
  "tour.rag.refusals": { page: "tour", label: "RAG refusals note", text: "The refusals (\"favorite poem?\", \"phone number?\", \"2024 Super Bowl?\") are out of scope on purpose: it declines all three with zero hallucination." },
  "tour.search.concept": { page: "tour", label: "search concept box", text: "<strong>Semantic search</strong> ranks by meaning, not keyword overlap, so \"make LLMs run faster\" finds \"KV-Cache Optimization\" despite zero shared words. Two details matter: a <strong>threshold</strong> (drop weak matches, since unrelated text still scores ~0.15, not 0), and rescaling the raw cosine into a friendlier percentage." },
  "tour.galaxy.concept": { page: "tour", label: "galaxy concept box", text: "Embeddings live in hundreds of dimensions, which you can't draw. <strong>PCA</strong> finds the directions of greatest variation and projects everything onto the top two, giving an x and y to plot while keeping as much real spread as possible. I compute it by hand via the <strong>Gram matrix</strong> and power iteration, no library." },
  "tour.galaxy.body": { page: "tour", label: "galaxy body", text: "Similar projects drift near each other, so the model roughly rediscovers my technical areas from text alone. An earlier version ran k-means and let an LLM name the clusters, but at near-zero separation it mislabeled things (a car-price project once landed in a \"Computer Vision\" cluster). So I color each dot by its real area instead. The layout shows the structure; the colors stay honest." },
  "tour.galaxy.pop": { page: "tour", label: "galaxy popovers", text: "The dots are interactive too: hover or tap one and a little card pops up with the project's area, domains, and actions, open the code, ask the chatbot about it, or <strong>find similar</strong>, which runs nearest-neighbors over the same cached vectors and filters the project grid above." },
  "tour.galaxy.you": { page: "tour", label: "galaxy drop-me-in", text: "You can also <strong>drop yourself into the map</strong>. Type an interest and it's embedded and projected onto the <em>same</em> two PCA axes as the projects, a proper <strong>out-of-sample projection</strong> (project the query onto the axes I already found, don't re-fit them), so your \"you are here\" star lands where it genuinely belongs. A line points to the single nearest project by cosine, and one click asks the chatbot about it. Semantic search, turned into a place on a map instead of a ranked list." },
  "tour.tag.concept": { page: "tour", label: "tagging concept box", text: "<strong>Zero-shot classification</strong> labels things with no training examples: describe each label in words, embed the descriptions and the post, and the closest label wins. Two refinements make it robust. <strong>Multi-prototype labels</strong>: average a few phrasings per category to cancel noise. And a <strong>confidence rule</strong> instead of blind argmax: a domain is attached only when it clears a floor and clearly beats the runner-up. When two are close, that's ambiguity, so it tags none. Precision over recall." },
  "tour.tag.body": { page: "tour", label: "tagging body", text: "This replaced a brittle keyword system that once tagged an encryption post as \"Food & Nutrition\" because the intro mentioned my cat's empty food bowl. I weight the <strong>title 2x</strong> in the embedded text, and this very post tagged itself." },
  "tour.tag.pills": { page: "tour", label: "tagging filter pills", text: "The tags then earn their keep: the Technical Blogs page builds its <strong>topic filter pills</strong> from whatever tags exist across posts, so publishing a post on a new area grows a new filter on its own, no code change." },
  "tour.tag.rules": { page: "tour", label: "tagging keyword cousin", text: "The Work grid has a cheaper cousin for terse GitHub repo descriptions: a deterministic keyword classifier, now <strong>multi-label</strong>, so a project that is genuinely both IoT and Computer Vision wears both tags instead of whichever rule fired first. Matching the method to the input: embeddings for prose, rules for metadata." },
  "tour.tag.emoji": { page: "tour", label: "tagging project emoji", text: "That same repo classifier also gives every auto-pulled project a distinct <strong>on-theme emoji</strong>: it reads the project's own words for a fitting icon (a gateway gets a traffic light, a benchmark a test tube, an encryption tool a lock), and when two projects would pick the same one it slides to a related icon, so the grid never becomes a wall of identical sparkles." },
  "tour.cluster.concept": { page: "tour", label: "clustering concept box", text: "<strong>k-means</strong> groups without labels: place k centers, assign each point to its nearest, move centers to the mean, repeat. The <strong>silhouette score</strong> (-1 to 1) picks the best k by comparing in-cluster tightness to the nearest other cluster. <strong>CLIP</strong> puts images and captions in a shared space, so a CLIP image embedding captures visual content directly." },
  "tour.cluster.note": { page: "tour", label: "clustering note", text: "Switching from caption text to CLIP image embeddings roughly doubled the silhouette and produced more meaningful groups. The pixels knew something the captions didn't." },
  "tour.llm.concept": { page: "tour", label: "LLM-as-function concept box", text: "A few features use an LLM as a function, not a chatbot: a strict instruction, <strong>temperature 0</strong> (minimum randomness, repeatable output), and structured <strong>JSON</strong>. Constrained like that, it becomes a reliable little classifier or rewriter." },
  "tour.llm.b1": { page: "tour", label: "LLM bullet: moods", text: "<strong>Poem mood classification</strong> into eight moods with a confidence score; average <strong>0.894</strong> across 8 poems, reported on the page." },
  "tour.llm.b2": { page: "tour", label: "LLM bullet: art", text: "<strong>AI poem art</strong>: a model distills each poem into one evocative prompt and an image model renders it. Cached so it is paid for once, but I can regenerate a fresh take, keep versions I like, or upload my own." },
  "tour.llm.b3": { page: "tour", label: "LLM bullet: captions", text: "<strong>Auto-captioned photos</strong> via a vision model, low-detail to stay cheap." },
  "tour.llm.b4": { page: "tour", label: "LLM bullet: ELI5", text: "<strong>ELI5 / expert toggle</strong> rewrites every blurb for a 10-year-old or a senior engineer, under a strict \"keep every fact truthful\" rule." },
  "tour.llm.b5": { page: "tour", label: "LLM bullet: guestbook mood", text: "<strong>Guestbook moods</strong>: when someone signs the guestbook, the same temperature-0 JSON trick sorts their note into one of six moods (sweet, excited, curious, funny, kind, proud) and pins a matching little emoji to it." },
  "tour.eng.b1": { page: "tour", label: "engineering bullet: caching", text: "<strong>Caching + ISR.</strong> Embeddings, art, captions, and rewrites are computed once; GitHub and Substack refresh hourly, so the site stays fresh without re-paying every request." },
  "tour.eng.b2": { page: "tour", label: "engineering bullet: batching", text: "<strong>Batched calls.</strong> Labels and classifications go out in one batched call, not one-per-item." },
  "tour.eng.b3": { page: "tour", label: "engineering bullet: fallback", text: "<strong>Graceful fallback.</strong> The live embedding classifier has a deterministic keyword backup, so a flaky API degrades quality instead of breaking the page." },
  "tour.eng.b4": { page: "tour", label: "engineering bullet: evals", text: "<strong>Evals as a habit.</strong> If I can't measure it, I try not to claim it." },
  "tour.eng.b5": { page: "tour", label: "engineering bullet: project cards", text: "<strong>Cards that carry their work.</strong> Beyond code and demo, a project card can link straight to a live results dashboard and a Substack write-up, its tags can be anything I want (reinforcement learning, robotics), and any PDF attachment renders its first page right in the card instead of a grey box." },
  "tour.close": { page: "tour", label: "closing line", text: "That is the whole machine: it embeds, retrieves, clusters, classifies, and grades its own homework. Thanks for reading the tour. 🌸" },

  // home tab cards (the four little doorways on the landing page)
  "home.tab.about": { page: "home", label: "About card blurb", text: "the human behind the models" },
  "home.tab.work": { page: "home", label: "Work card blurb", text: "projects, growing in a meadow" },
  "home.tab.blog": { page: "home", label: "Blog card blurb", text: "essays, poems & photographs" },
  "home.tab.contact": { page: "home", label: "Contact card blurb", text: "let's say hello" },
  "home.tab.about.icon": { page: "home", label: "About card emoji", text: "🦦" },
  "home.tab.work.icon": { page: "home", label: "Work card emoji", text: "🌱" },
  "home.tab.blog.icon": { page: "home", label: "Blog card emoji", text: "🎐" },
  "home.tab.contact.icon": { page: "home", label: "Contact card emoji", text: "💌" },

  // now-page section headings
  "now.head.working": { page: "now", label: "🌱 working-on heading", text: "working on" },
  "now.head.learning": { page: "now", label: "📚 learning heading", text: "learning" },
  "now.head.tinkering": { page: "now", label: "🛠️ tinkering heading", text: "tinkering" },
  "now.head.offclock": { page: "now", label: "🍵 off-the-clock heading", text: "off the clock" },
  "now.head.tools": { page: "now", label: "tools heading", text: "🧰 tools i reach for daily" },

  // footer (the © line sets its own year automatically)
  "footer.name": { page: "footer", label: "footer name / sign-off", text: "Rishika Mamidibathula" },
};

export type CopyMap = Record<string, string>;

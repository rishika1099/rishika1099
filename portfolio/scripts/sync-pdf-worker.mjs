// The PDF previews on About are drawn by pdf.js, whose two halves must be the
// same version: the library the page imports, and the worker file the browser
// fetches from /pdfjs. The worker is a copy kept in public/, and when the
// library was upgraded the copy was not, so every preview failed quietly and
// fell back to a blank document icon. This makes the copy from whatever is
// installed, before every dev run and every build, so the two cannot drift.
import fs from "node:fs";

const from = "node_modules/pdfjs-dist/build/pdf.worker.min.mjs";
const to = "public/pdfjs/pdf.worker.min.mjs";
fs.mkdirSync("public/pdfjs", { recursive: true });
fs.copyFileSync(from, to);

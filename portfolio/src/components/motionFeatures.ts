// Split out on purpose: this is the only module that pulls framer-motion's DOM
// feature set in, so the bundler can keep it in a chunk of its own that loads
// after hydration instead of ahead of the first paint. domMax rather than
// domAnimation because the work shelves and blog lists use layout animations.
import { domMax } from "framer-motion";

export default domMax;

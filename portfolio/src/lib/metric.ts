// Count something a visitor did that is not a link click: a form that worked,
// a posting matched. Metrics.tsx listens for this and does the sending, and it
// is not listening on the owner's own device, so her own tries are not counted.
export const METRIC_EVENT = "site-metric";

export function metric(name: string) {
  try {
    window.dispatchEvent(new CustomEvent<string>(METRIC_EVENT, { detail: name }));
  } catch {
    // counting must never break the page
  }
}

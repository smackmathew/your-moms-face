// Printify's mockup server can send smaller copies of a photo: s=200 or s=400. Any other size
// comes back as the 1200px original, so those two are the only ones worth asking for.
const PRINTIFY_MOCKUP = /^https:\/\/images(-api)?\.printify\.com\/mockup\//;

export function sized(src: string, size: 200 | 400): string {
  if (!PRINTIFY_MOCKUP.test(src)) return src;
  return `${src}${src.includes("?") ? "&" : "?"}s=${size}`;
}

/** srcset for a photo shown around `size` CSS pixels wide, with the original for sharper screens. */
export function srcSet(src: string, size: 200 | 400): string | undefined {
  if (!PRINTIFY_MOCKUP.test(src)) return undefined;
  return `${sized(src, size)} ${size}w, ${src} 1200w`;
}

const started = new Set<string>();

/** Starts downloading a photo into the browser cache so it shows instantly later. */
export function preload(src: string | undefined): void {
  if (!src || started.has(src)) return;
  started.add(src);
  const img = new Image();
  img.decoding = "async";
  img.src = src;
}

/** Runs `work` once the browser is idle, so preloading never slows down the page itself. */
export function whenIdle(work: () => void): () => void {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(work, { timeout: 1500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(work, 300);
  return () => clearTimeout(id);
}

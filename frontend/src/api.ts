import { sampleProducts } from "./sampleProducts";
import type { CartLine, Product } from "./types";

const useSamples = import.meta.env.VITE_SAMPLE_PRODUCTS === "true";

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.error === "string") return body.error;
  } catch {
    // not JSON
  }
  return "Something went wrong. Try again in a minute.";
}

export async function fetchProducts(): Promise<Product[]> {
  if (useSamples) return sampleProducts;
  try {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error(await readError(res));
    return (await res.json()).products as Product[];
  } catch (err) {
    // While developing without the emulators running, show the examples instead of an empty shop.
    if (import.meta.env.DEV) return sampleProducts;
    throw err;
  }
}

/** Starts a Stripe checkout and returns the page to send the customer to. */
export async function startCheckout(lines: CartLine[]): Promise<string> {
  if (lines.some((l) => l.productId.startsWith("sample-"))) {
    throw new Error("These are example products. Connect your Printify shop to sell real ones.");
  }
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: lines.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()).url as string;
}

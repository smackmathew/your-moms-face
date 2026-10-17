// Pure helpers shared by the functions: turning Printify products into what the storefront
// shows, pricing a cart on the server, and building the Printify order from a paid checkout.

/** A product as Printify's API returns it (only the fields the store uses). */
export interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  visible?: boolean;
  images: { src: string; variant_ids: number[]; position?: string; is_default?: boolean }[];
  options: { name: string; type: string; values: { id: number; title: string; colors?: string[] }[] }[];
  variants: {
    id: number;
    title: string;
    price: number; // cents
    is_enabled: boolean;
    is_available?: boolean;
    options: number[];
  }[];
}

/** A product as the storefront sees it. */
export interface StoreProduct {
  id: string;
  title: string;
  description: string;
  images: { src: string; variantIds: number[]; isDefault: boolean }[];
  options: { name: string; type: string; values: { id: number; title: string; colors?: string[] }[] }[];
  variants: { id: number; title: string; priceCents: number; optionIds: number[]; available: boolean }[];
  minPriceCents: number;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };

/** Printify descriptions are HTML; the store shows them as plain text. */
export function stripHtml(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|li|div|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, e: string) => ENTITIES[e])
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** The variant a Printify mockup was rendered for: https://images.printify.com/mockup/{product}/{variant}/{camera}/… */
export function mockupVariantId(src: string): number | null {
  const m = /\/mockup\/[^/]+\/(\d+)\/\d+\//.exec(src);
  return m ? Number(m[1]) : null;
}

/** Keeps only the variants a customer can buy. Returns null when there are none. */
export function toStoreProduct(p: PrintifyProduct): StoreProduct | null {
  if (p.visible === false) return null;
  const variants = p.variants
    .filter((v) => v.is_enabled)
    .map((v) => ({
      id: v.id,
      title: v.title,
      priceCents: v.price,
      optionIds: v.options,
      available: v.is_available !== false,
    }));
  if (variants.length === 0) return null;
  const inStock = variants.filter((v) => v.available);

  // Drop option values (sizes, colors) that no enabled variant uses.
  const used = new Set(variants.flatMap((v) => v.optionIds));
  const options = p.options
    .map((o) => ({ ...o, values: o.values.filter((val) => used.has(val.id)) }))
    .filter((o) => o.values.length > 0);

  const enabledIds = new Set(variants.map((v) => v.id));
  const colorIds = new Set(p.options.find((o) => o.type === "color")?.values.map((v) => v.id) ?? []);
  const colorOf = (variantId: number) => p.variants.find((v) => v.id === variantId)?.options.find((id) => colorIds.has(id));
  const images = p.images
    .map((img) => {
      let ids = img.variant_ids.filter((id) => enabledIds.has(id));
      // Printify often tags every mockup with every variant. The variant the mockup was
      // rendered for is in its URL, so keep only the variants of that one color.
      const color = colorOf(mockupVariantId(img.src) ?? NaN);
      if (color !== undefined) {
        const sameColor = ids.filter((id) => colorOf(id) === color);
        if (sameColor.length > 0) ids = sameColor;
      }
      return { src: img.src, variantIds: ids, isDefault: img.is_default === true };
    })
    .filter((img) => img.variantIds.length > 0)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

  return {
    id: p.id,
    title: p.title,
    description: stripHtml(p.description ?? ""),
    images,
    options,
    variants,
    minPriceCents: Math.min(...(inStock.length > 0 ? inStock : variants).map((v) => v.priceCents)),
  };
}

export interface CartItem {
  productId: string;
  variantId: number;
  quantity: number;
}

export interface PricedLine extends CartItem {
  title: string;
  variantTitle: string;
  priceCents: number;
  image?: string;
}

export const MAX_QUANTITY = 20;
export const MAX_LINES = 30;

export class CartError extends Error {}

/**
 * Checks a cart the browser sent against the live catalog and prices it from the catalog,
 * so the price a customer pays never comes from the browser.
 */
export function priceCart(input: unknown, products: Map<string, StoreProduct>): PricedLine[] {
  if (!Array.isArray(input) || input.length === 0) throw new CartError("Your cart is empty.");
  if (input.length > MAX_LINES) throw new CartError(`A cart can hold up to ${MAX_LINES} different items.`);

  const merged = new Map<string, CartItem>();
  for (const raw of input) {
    const { productId, variantId, quantity } = (raw ?? {}) as Record<string, unknown>;
    if (typeof productId !== "string" || !Number.isInteger(variantId) || !Number.isInteger(quantity)) {
      throw new CartError("Something in your cart isn't readable. Remove it and add it again.");
    }
    const key = `${productId}:${variantId}`;
    const qty = (merged.get(key)?.quantity ?? 0) + (quantity as number);
    merged.set(key, { productId, variantId: variantId as number, quantity: qty });
  }

  return [...merged.values()].map((item) => {
    if (item.quantity < 1 || item.quantity > MAX_QUANTITY) {
      throw new CartError(`Quantities go from 1 to ${MAX_QUANTITY}.`);
    }
    const product = products.get(item.productId);
    const variant = product?.variants.find((v) => v.id === item.variantId);
    if (!product || !variant) {
      throw new CartError("An item in your cart is no longer sold. Remove it to continue.");
    }
    if (!variant.available) {
      throw new CartError(`${product.title} (${variant.title}) is out of stock. Remove it to continue.`);
    }
    const image = product.images.find((img) => img.variantIds.includes(variant.id)) ?? product.images[0];
    return {
      ...item,
      title: product.title,
      variantTitle: variant.title,
      priceCents: variant.priceCents,
      image: image?.src,
    };
  });
}

/** The parts of a Stripe Checkout Session needed to ship the order. */
export interface PaidSession {
  id: string;
  email: string | null;
  phone: string | null;
  shipping: {
    name: string | null;
    address: {
      line1: string | null;
      line2: string | null;
      city: string | null;
      state: string | null;
      postal_code: string | null;
      country: string | null;
    };
  } | null;
}

export interface PrintifyOrder {
  external_id: string;
  label: string;
  line_items: { product_id: string; variant_id: number; quantity: number }[];
  shipping_method: number;
  send_shipping_notification: boolean;
  address_to: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: string;
    region: string;
    address1: string;
    address2: string;
    city: string;
    zip: string;
  };
}

export function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

export function buildPrintifyOrder(session: PaidSession, items: CartItem[]): PrintifyOrder {
  const ship = session.shipping;
  if (!ship?.address?.line1 || !ship.address.country) {
    throw new Error(`Checkout ${session.id} has no shipping address`);
  }
  const { first, last } = splitName(ship.name ?? "");
  const a = ship.address;
  return {
    external_id: session.id,
    label: `Web order ${session.id.slice(-8)}`,
    line_items: items.map((i) => ({ product_id: i.productId, variant_id: i.variantId, quantity: i.quantity })),
    shipping_method: 1, // Printify standard shipping
    send_shipping_notification: true,
    address_to: {
      first_name: first,
      last_name: last,
      email: session.email ?? "",
      phone: session.phone ?? "",
      country: a.country ?? "",
      region: a.state ?? "",
      address1: a.line1 ?? "",
      address2: a.line2 ?? "",
      city: a.city ?? "",
      zip: a.postal_code ?? "",
    },
  };
}

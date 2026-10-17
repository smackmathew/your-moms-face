import { describe, expect, it } from "vitest";
import {
  buildPrintifyOrder,
  mockupVariantId,
  CartError,
  priceCart,
  splitName,
  stripHtml,
  toStoreProduct,
  type PrintifyProduct,
  type StoreProduct,
} from "../src/store.js";

const tee: PrintifyProduct = {
  id: "p1",
  title: "Contour Tee",
  description: "<p>Soft cotton.</p><ul><li>100% cotton</li><li>Unisex fit</li></ul>",
  images: [
    { src: "https://img/black.png", variant_ids: [1, 2], is_default: false },
    { src: "https://img/white.png", variant_ids: [3], is_default: true },
    { src: "https://img/red.png", variant_ids: [9] },
  ],
  options: [
    { name: "Colors", type: "color", values: [{ id: 10, title: "Black" }, { id: 11, title: "White" }, { id: 12, title: "Red" }] },
    { name: "Sizes", type: "size", values: [{ id: 20, title: "M" }, { id: 21, title: "L" }] },
  ],
  variants: [
    { id: 1, title: "Black / M", price: 2800, is_enabled: true, is_available: true, options: [10, 20] },
    { id: 2, title: "Black / L", price: 3000, is_enabled: true, is_available: false, options: [10, 21] },
    { id: 3, title: "White / M", price: 2600, is_enabled: true, options: [11, 20] },
    { id: 9, title: "Red / M", price: 1000, is_enabled: false, options: [12, 20] },
  ],
};

describe("stripHtml", () => {
  it("keeps line breaks and decodes entities", () => {
    expect(stripHtml("<p>Tom &amp; Jerry</p><p>Line<br/>two</p>")).toBe("Tom & Jerry\nLine\ntwo");
  });
});

describe("toStoreProduct", () => {
  const p = toStoreProduct(tee)!;

  it("drops disabled variants, unused option values and their images", () => {
    expect(p.variants.map((v) => v.id)).toEqual([1, 2, 3]);
    expect(p.options[0].values.map((v) => v.title)).toEqual(["Black", "White"]);
    expect(p.images.map((i) => i.src)).toEqual(["https://img/white.png", "https://img/black.png"]);
  });

  it("reports the lowest in-stock price", () => {
    expect(p.minPriceCents).toBe(2600);
    expect(p.variants.find((v) => v.id === 2)!.available).toBe(false);
  });

  it("hides products that aren't visible or have nothing to buy", () => {
    expect(toStoreProduct({ ...tee, visible: false })).toBeNull();
    expect(toStoreProduct({ ...tee, variants: tee.variants.map((v) => ({ ...v, is_enabled: false })) })).toBeNull();
  });
});

describe("mockup colors", () => {
  const all = [1, 2, 3];
  const shirt: PrintifyProduct = {
    ...tee,
    images: [
      { src: "https://images.printify.com/mockup/abc/3/555/tee.jpg", variant_ids: all, is_default: true },
      { src: "https://images.printify.com/mockup/abc/2/555/tee.jpg", variant_ids: all },
      { src: "https://img/elsewhere.png", variant_ids: all },
    ],
  };

  it("reads the variant from a mockup URL", () => {
    expect(mockupVariantId("https://images.printify.com/mockup/abc/37205/102230/x.jpg?camera_label=front")).toBe(37205);
    expect(mockupVariantId("https://img/elsewhere.png")).toBeNull();
  });

  it("narrows a mockup tagged with every variant to its own color", () => {
    const p = toStoreProduct(shirt)!;
    expect(p.images.map((i) => i.variantIds)).toEqual([[3], [1, 2], all]);
  });
});

describe("priceCart", () => {
  const catalog = new Map<string, StoreProduct>([["p1", toStoreProduct(tee)!]]);

  it("prices lines from the catalog and merges duplicates", () => {
    const lines = priceCart(
      [
        { productId: "p1", variantId: 1, quantity: 1, priceCents: 1 },
        { productId: "p1", variantId: 1, quantity: 2 },
      ],
      catalog,
    );
    expect(lines).toEqual([
      { productId: "p1", variantId: 1, quantity: 3, title: "Contour Tee", variantTitle: "Black / M", priceCents: 2800, image: "https://img/black.png" },
    ]);
  });

  it("rejects empty, unknown, out-of-stock and oversized carts", () => {
    expect(() => priceCart([], catalog)).toThrow(CartError);
    expect(() => priceCart([{ productId: "nope", variantId: 1, quantity: 1 }], catalog)).toThrow(/no longer sold/);
    expect(() => priceCart([{ productId: "p1", variantId: 9, quantity: 1 }], catalog)).toThrow(/no longer sold/);
    expect(() => priceCart([{ productId: "p1", variantId: 2, quantity: 1 }], catalog)).toThrow(/out of stock/);
    expect(() => priceCart([{ productId: "p1", variantId: 1, quantity: 21 }], catalog)).toThrow(/1 to 20/);
    expect(() => priceCart([{ productId: "p1", variantId: 1, quantity: 1.5 }], catalog)).toThrow(CartError);
  });
});

describe("buildPrintifyOrder", () => {
  it("maps the Stripe shipping address to Printify's", () => {
    const order = buildPrintifyOrder(
      {
        id: "cs_test_abcdefgh12345678",
        email: "pat@example.com",
        phone: "+15555550100",
        shipping: {
          name: "Pat Q Public",
          address: { line1: "1 Main St", line2: null, city: "Austin", state: "TX", postal_code: "78701", country: "US" },
        },
      },
      [{ productId: "p1", variantId: 1, quantity: 2 }],
    );
    expect(order.external_id).toBe("cs_test_abcdefgh12345678");
    expect(order.line_items).toEqual([{ product_id: "p1", variant_id: 1, quantity: 2 }]);
    expect(order.address_to).toMatchObject({
      first_name: "Pat Q",
      last_name: "Public",
      region: "TX",
      zip: "78701",
      address2: "",
      email: "pat@example.com",
    });
  });

  it("refuses a checkout with no address", () => {
    expect(() => buildPrintifyOrder({ id: "cs_1", email: null, phone: null, shipping: null }, [])).toThrow(/no shipping address/);
  });

  it("splits names", () => {
    expect(splitName("Cher")).toEqual({ first: "Cher", last: "" });
    expect(splitName("  ")).toEqual({ first: "", last: "" });
  });
});

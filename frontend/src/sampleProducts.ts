import type { Product } from "./types";

// Example products for trying the design before Printify is connected. Real products come
// from /api/products. Their images are drawn here so nothing loads from elsewhere.

type Garment = "tee" | "hoodie" | "hat";

const SHAPES: Record<Garment, string> = {
  tee: "M150 70 L200 50 Q250 80 300 50 L350 70 L420 130 L380 180 L340 155 L340 360 L160 360 L160 155 L120 180 L80 130 Z",
  hoodie:
    "M150 85 Q190 30 250 30 Q310 30 350 85 L420 150 L390 330 L355 320 L350 370 L150 370 L145 320 L110 330 L80 150 Z",
  hat: "M120 240 Q120 110 250 110 Q380 110 380 240 L430 255 Q440 275 410 280 L90 280 Q60 275 70 255 Z",
};

function art(garment: Garment, fill: string, ink: string): string {
  const cy = garment === "hat" ? 190 : 205;
  // A small crown print, echoing the logo.
  const crown = `<g transform="translate(250 ${cy}) scale(1.6) translate(-32 -32)" fill="#EAA823" stroke="${ink}" stroke-width="3.6" stroke-linejoin="round"><path d="M14 42 L8 20 L23 30 L32 11 L41 30 L56 20 L50 42 Z"/><path d="M9 48 Q32 42 55 48 L54 57 Q32 51 10 57 Z"/><circle cx="8" cy="16.5" r="4.2"/><circle cx="32" cy="7.5" r="4.2"/><circle cx="56" cy="16.5" r="4.2"/></g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 420"><rect width="500" height="420" fill="#FFFFFF"/><path d="${SHAPES[garment]}" fill="${fill}" stroke="#141414" stroke-width="3"/>${crown}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

interface Spec {
  id: string;
  title: string;
  description: string;
  garment: Garment;
  colors: { title: string; hex: string; ink: string }[];
  sizes: string[];
  priceCents: number;
}

const specs: Spec[] = [
  {
    id: "sample-heavy-crown-tee",
    title: "Heavy Is the Crown Tee",
    description: "The royal motto, worn by those who carry the weight.\nHeavyweight cotton, unisex fit.",
    garment: "tee",
    colors: [
      { title: "Black", hex: "#1D211F", ink: "#E9A23B" },
      { title: "Sage", hex: "#A9B89E", ink: "#1A2520" },
      { title: "White", hex: "#F5F5F0", ink: "#1A2520" },
    ],
    sizes: ["S", "M", "L", "XL", "2XL"],
    priceCents: 2800,
  },
  {
    id: "sample-royally-unbothered-hoodie",
    title: "Royally Unbothered Hoodie",
    description: "Midweight fleece pullover with front pocket. For ignoring your problems in comfort.",
    garment: "hoodie",
    colors: [
      { title: "Hi-Vis", hex: "#E9A23B", ink: "#1A2520" },
      { title: "Charcoal", hex: "#3A403C", ink: "#E9A23B" },
    ],
    sizes: ["S", "M", "L", "XL", "2XL"],
    priceCents: 5400,
  },
  {
    id: "sample-nap-king-dad-hat",
    title: "Nap King Dad Hat",
    description: "Unstructured cotton twill cap with an embroidered crown. One size, adjustable strap.",
    garment: "hat",
    colors: [
      { title: "Khaki", hex: "#C9B98F", ink: "#1A2520" },
      { title: "Navy", hex: "#22304A", ink: "#E9A23B" },
    ],
    sizes: ["One size"],
    priceCents: 3200,
  },
  {
    id: "sample-sarcasm-included-tee",
    title: "Sarcasm Included Tee",
    description: "Garment-dyed tee. Batteries not included. Sarcasm is. Relaxed fit.",
    garment: "tee",
    colors: [
      { title: "Clay", hex: "#B9805E", ink: "#1A2520" },
      { title: "Moss", hex: "#56634A", ink: "#E9A23B" },
    ],
    sizes: ["S", "M", "L", "XL"],
    priceCents: 3000,
  },
];

export const sampleProducts: Product[] = specs.map((s, si) => {
  const colorValues = s.colors.map((c, i) => ({ id: si * 100 + i, title: c.title, colors: [c.hex] }));
  const sizeValues = s.sizes.map((size, i) => ({ id: si * 100 + 50 + i, title: size }));
  const variants = colorValues.flatMap((c) =>
    sizeValues.map((z) => ({
      id: c.id * 1000 + z.id,
      title: `${c.title} / ${z.title}`,
      priceCents: s.priceCents + (z.title === "2XL" ? 300 : 0),
      optionIds: [c.id, z.id],
      available: !(c.title === "White" && z.title === "2XL"),
    })),
  );
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    images: s.colors.map((c, i) => ({
      src: art(s.garment, c.hex, c.ink),
      variantIds: variants.filter((v) => v.optionIds[0] === colorValues[i].id).map((v) => v.id),
      isDefault: i === 0,
    })),
    options: [
      { name: "Colors", type: "color", values: colorValues },
      { name: "Sizes", type: "size", values: sizeValues },
    ],
    variants,
    minPriceCents: s.priceCents,
    sample: true,
  };
});

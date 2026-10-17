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
  const cy = garment === "hat" ? 200 : 210;
  const rings = [44, 30, 16]
    .map((r) => `<ellipse cx="250" cy="${cy}" rx="${r * 1.25}" ry="${r}" fill="none" stroke="${ink}" stroke-width="3"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 420"><rect width="500" height="420" fill="#F3F5EF"/><path d="${SHAPES[garment]}" fill="${fill}" stroke="#1A2520" stroke-width="2"/>${rings}</svg>`;
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
    id: "sample-contour-tee",
    title: "Contour Tee",
    description: "The survey map of the most famous landmark on the playground, printed on the chest.\nHeavyweight cotton, unisex fit.",
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
    id: "sample-visible-from-orbit-hoodie",
    title: "Visible From Orbit Hoodie",
    description: "Midweight fleece pullover with front pocket. Big enough to have its own weather system.",
    garment: "hoodie",
    colors: [
      { title: "Hi-Vis", hex: "#E9A23B", ink: "#1A2520" },
      { title: "Charcoal", hex: "#3A403C", ink: "#E9A23B" },
    ],
    sizes: ["S", "M", "L", "XL", "2XL"],
    priceCents: 5400,
  },
  {
    id: "sample-summit-dad-hat",
    title: "Summit Dad Hat",
    description: "Unstructured cotton twill cap with an embroidered contour patch. One size, adjustable strap.",
    garment: "hat",
    colors: [
      { title: "Khaki", hex: "#C9B98F", ink: "#1A2520" },
      { title: "Navy", hex: "#22304A", ink: "#E9A23B" },
    ],
    sizes: ["One size"],
    priceCents: 3200,
  },
  {
    id: "sample-field-survey-tee",
    title: "Field Survey Tee",
    description: "Garment-dyed tee for fieldwork, recess and comebacks. Relaxed fit.",
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

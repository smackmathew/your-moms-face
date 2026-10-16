// Mirrors StoreProduct in functions/src/store.ts.
export interface OptionValue {
  id: number;
  title: string;
  colors?: string[];
}

export interface Product {
  id: string;
  title: string;
  description: string;
  images: { src: string; variantIds: number[]; isDefault: boolean }[];
  options: { name: string; type: string; values: OptionValue[] }[];
  variants: { id: number; title: string; priceCents: number; optionIds: number[]; available: boolean }[];
  minPriceCents: number;
  sample?: boolean;
}

export interface CartLine {
  productId: string;
  variantId: number;
  quantity: number;
  // Shown in the cart; the server re-prices everything at checkout.
  title: string;
  variantTitle: string;
  priceCents: number;
  image?: string;
}

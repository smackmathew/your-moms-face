import { useEffect, useState } from "react";
import { fetchProducts } from "./api";
import type { Product } from "./types";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; products: Product[] };

let cached: Promise<Product[]> | null = null;

export function useProducts(): State {
  const [state, setState] = useState<State>({ status: "loading" });
  useEffect(() => {
    let live = true;
    cached ??= fetchProducts();
    cached.then(
      (products) => live && setState({ status: "ready", products }),
      (err: Error) => {
        cached = null;
        if (live) setState({ status: "error", message: err.message });
      },
    );
    return () => {
      live = false;
    };
  }, []);
  return state;
}

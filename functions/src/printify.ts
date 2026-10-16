import type { PrintifyOrder, PrintifyProduct } from "./store.js";

// https://developers.printify.com/
const BASE = "https://api.printify.com/v1";

export class PrintifyClient {
  constructor(private token: string, private shopId: string) {}

  private async call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        "User-Agent": "YourMomsFace-Store",
        ...init.headers,
      },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Printify ${init.method ?? "GET"} ${path} failed (${res.status}): ${text.slice(0, 500)}`);
    return (text ? JSON.parse(text) : {}) as T;
  }

  /** Every product in the shop, following Printify's pagination. */
  async listProducts(): Promise<PrintifyProduct[]> {
    const all: PrintifyProduct[] = [];
    for (let page = 1; ; page++) {
      const res = await this.call<{ data: PrintifyProduct[]; last_page: number }>(
        `/shops/${this.shopId}/products.json?page=${page}&limit=50`,
      );
      all.push(...res.data);
      if (page >= res.last_page) return all;
    }
  }

  createOrder(order: PrintifyOrder): Promise<{ id: string }> {
    return this.call(`/shops/${this.shopId}/orders.json`, { method: "POST", body: JSON.stringify(order) });
  }

  sendToProduction(orderId: string): Promise<unknown> {
    return this.call(`/shops/${this.shopId}/orders/${orderId}/send_to_production.json`, { method: "POST" });
  }
}

import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { defineSecret, defineString } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";
import Stripe from "stripe";
import { PrintifyClient } from "./printify.js";
import { buildPrintifyOrder, CartError, priceCart, toStoreProduct, type CartItem, type PaidSession, type StoreProduct } from "./store.js";

initializeApp();
const db = getFirestore();

// Set in functions/.env; the secrets with
// `firebase functions:secrets:set <NAME>`.
const printifyToken = defineSecret("PRINTIFY_API_TOKEN");
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const printifyShopId = defineString("PRINTIFY_SHOP_ID");
// Empty means "the address the customer is shopping on".
const siteUrl = defineString("SITE_URL", { default: "" });
const flatShippingCents = defineString("FLAT_SHIPPING_CENTS", { default: "599" });
const shipCountries = defineString("SHIP_COUNTRIES", { default: "US" });
const autoSendToProduction = defineString("AUTO_SEND_TO_PRODUCTION", { default: "false" });

const printify = () => new PrintifyClient(printifyToken.value(), printifyShopId.value());
const stripe = () => new Stripe(stripeSecretKey.value());

// Printify's API is rate limited, so each function instance keeps the catalog for a few minutes.
const CATALOG_TTL_MS = 5 * 60 * 1000;
let catalog: { at: number; products: StoreProduct[] } | null = null;

async function loadCatalog(): Promise<StoreProduct[]> {
  if (catalog && Date.now() - catalog.at < CATALOG_TTL_MS) return catalog.products;
  const raw = await printify().listProducts();
  const products = raw.map(toStoreProduct).filter((p): p is StoreProduct => p !== null);
  catalog = { at: Date.now(), products };
  return products;
}

/** GET /api/products: the shop's products, ready for the storefront. */
export const products = onRequest({ secrets: [printifyToken] }, async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Use GET." });
    return;
  }
  try {
    const list = await loadCatalog();
    res.set("Cache-Control", "public, max-age=60, s-maxage=300");
    res.json({ products: list });
  } catch (err) {
    logger.error("Loading products from Printify failed", err);
    res.status(502).json({ error: "The shop couldn't load products right now. Try again in a minute." });
  }
});

/** POST /api/checkout { items: CartItem[] } → { url } of a Stripe Checkout page. */
export const checkout = onRequest({ secrets: [printifyToken, stripeSecretKey] }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST." });
    return;
  }
  let lines;
  try {
    const byId = new Map((await loadCatalog()).map((p) => [p.id, p]));
    lines = priceCart(req.body?.items, byId);
  } catch (err) {
    if (err instanceof CartError) {
      res.status(400).json({ error: err.message });
      return;
    }
    logger.error("Pricing the cart failed", err);
    res.status(502).json({ error: "Checkout isn't available right now. Try again in a minute." });
    return;
  }

  const base = (siteUrl.value() || `https://${req.get("x-forwarded-host") ?? req.get("host")}`).replace(/\/$/, "");
  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: lines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: "usd",
          unit_amount: l.priceCents,
          product_data: {
            name: `${l.title} (${l.variantTitle})`,
            ...(l.image ? { images: [l.image] } : {}),
          },
        },
      })),
      shipping_address_collection: {
        allowed_countries: shipCountries
          .value()
          .split(",")
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean) as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: "Standard shipping",
            fixed_amount: { amount: Number(flatShippingCents.value()), currency: "usd" },
          },
        },
      ],
      phone_number_collection: { enabled: true },
      success_url: `${base}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/cart`,
    });

    // The cart is kept here rather than in Stripe metadata, which caps each value at 500 characters.
    const items: CartItem[] = lines.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity }));
    await db.collection("checkouts").doc(session.id).set({
      items,
      status: "pending",
      created_at: FieldValue.serverTimestamp(),
    });
    res.json({ url: session.url });
  } catch (err) {
    logger.error("Creating the Stripe checkout failed", err);
    res.status(502).json({ error: "Checkout isn't available right now. Try again in a minute." });
  }
});

/** Stripe calls this when a checkout is paid; it places the order at Printify. */
export const stripeWebhook = onRequest(
  { secrets: [printifyToken, stripeSecretKey, stripeWebhookSecret] },
  async (req, res) => {
    let event: Stripe.Event;
    try {
      event = stripe().webhooks.constructEvent(req.rawBody, req.get("stripe-signature") ?? "", stripeWebhookSecret.value());
    } catch (err) {
      logger.warn("Rejected a webhook with a bad signature", err);
      res.status(400).send("Bad signature");
      return;
    }

    let sessionId: string | null = null;
    if (event.type === "checkout.session.completed" && event.data.object.payment_status === "paid") {
      sessionId = event.data.object.id;
    } else if (event.type === "checkout.session.async_payment_succeeded") {
      sessionId = event.data.object.id;
    }
    if (!sessionId) {
      res.json({ received: true });
      return;
    }

    try {
      await fulfill(sessionId);
      res.json({ received: true });
    } catch (err) {
      logger.error(`Placing the Printify order for ${sessionId} failed`, err);
      // A non-2xx answer makes Stripe retry the delivery later.
      res.status(500).send("Fulfillment failed");
    }
  },
);

async function fulfill(sessionId: string): Promise<void> {
  const ref = db.collection("checkouts").doc(sessionId);

  // Claim the checkout so a repeated or simultaneous webhook can't place the order twice.
  const items = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error(`No saved cart for checkout ${sessionId}`);
    const status = snap.get("status");
    if (status !== "pending" && status !== "failed") return null;
    tx.update(ref, { status: "submitting" });
    return snap.get("items") as CartItem[];
  });
  if (!items) {
    logger.info(`Checkout ${sessionId} was already handled`);
    return;
  }

  let printifyOrderId: string;
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    const order = buildPrintifyOrder(paidSession(session), items);
    ({ id: printifyOrderId } = await printify().createOrder(order));
  } catch (err) {
    await ref.update({ status: "failed", error: String(err) });
    throw err;
  }
  await ref.update({ status: "submitted", printify_order_id: printifyOrderId, submitted_at: FieldValue.serverTimestamp() });
  logger.info(`Checkout ${sessionId} placed as Printify order ${printifyOrderId}`);

  // The order exists at Printify now, so a failure here must not let Stripe's retry place it again.
  // It stays "On hold" in Printify, where it can be sent to production by hand.
  if (autoSendToProduction.value() === "true") {
    try {
      await printify().sendToProduction(printifyOrderId);
      await ref.update({ status: "in_production" });
    } catch (err) {
      logger.error(`Printify order ${printifyOrderId} was placed but not sent to production`, err);
    }
  }
}

function paidSession(s: Stripe.Checkout.Session): PaidSession {
  // Newer Stripe API versions moved shipping details under collected_information.
  const loose = s as unknown as {
    shipping_details?: PaidSession["shipping"];
    collected_information?: { shipping_details?: PaidSession["shipping"] };
  };
  return {
    id: s.id,
    email: s.customer_details?.email ?? null,
    phone: s.customer_details?.phone ?? null,
    shipping: loose.collected_information?.shipping_details ?? loose.shipping_details ?? null,
  };
}

# Your Moms Face

The storefront for Your Moms Face apparel. Products come from your **Printify** shop, customers
pay through **Stripe Checkout**, and each paid order is placed at Printify automatically, which
prints and ships it.

## How it works

```
Printify shop ──products──▶ /api/products ──▶ storefront (React)
                                                  │ cart
                                                  ▼
                           /api/checkout ──▶ Stripe Checkout (card, address, shipping)
                                                  │ paid
                                                  ▼
Printify order ◀──────── /api/stripe-webhook
```

- **Frontend** (`frontend/`): React + TypeScript (Vite), served by Firebase Hosting. Product
  pages with color and size pickers, a cart kept in the browser, and a thank-you page.
- **Cloud Functions** (`functions/`, TypeScript):
  - `products` reads your Printify catalog (cached for 5 minutes) and hides disabled variants.
  - `checkout` re-prices the cart from Printify, so the browser never sets a price, then opens a
    Stripe Checkout page that collects the shipping address and adds a flat shipping charge.
  - `stripeWebhook` runs when Stripe confirms payment. It places the order at Printify, using the
    Stripe checkout ID as Printify's `external_id`. Firestore records each checkout so a repeated
    webhook can't place an order twice.
- Your Printify token and Stripe keys stay in Cloud Functions secrets. The browser never sees them.

## Putting it online

You need Node.js 22, the Firebase CLI (`npm i -g firebase-tools`), and a Firebase project on the
**Blaze** plan (Cloud Functions need it; a small shop should stay inside the free allowance).

1. **Printify**
   - In Printify, go to **Manage stores → Add new store** and choose the **API** option (it may
     be listed as "Other" or "Custom integration") so orders from this site land in their own store.
   - Design your products in that store.
   - Create a token under **Account → Connections → Personal access tokens** with the
     `shops.read`, `products.read` and `orders.write` scopes.
   - Find your shop ID:
     `curl -H "Authorization: Bearer YOUR_TOKEN" https://api.printify.com/v1/shops.json`
2. **Stripe**: from the Stripe dashboard, copy your secret key (start with the test-mode key).
3. **Firebase**
   ```sh
   firebase login
   firebase use --add                          # pick your project
   cp functions/.env.example functions/.env    # fill in PRINTIFY_SHOP_ID, SITE_URL and the rest
   firebase functions:secrets:set PRINTIFY_API_TOKEN
   firebase functions:secrets:set STRIPE_SECRET_KEY
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET   # enter "placeholder" for now
   npm --prefix functions install && npm --prefix frontend install
   firebase deploy
   ```
4. **Stripe webhook**: in Stripe, go to **Developers → Webhooks → Add endpoint**.
   - URL: `https://YOUR-SITE/api/stripe-webhook`
   - Events: `checkout.session.completed` and `checkout.session.async_payment_succeeded`

   Copy its signing secret (`whsec_…`), then set it and redeploy the functions:
   ```sh
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   firebase deploy --only functions
   ```
5. **Test an order** with Stripe's test card `4242 4242 4242 4242`. The order shows up in
   Printify as **On hold**. Check it, then delete it or send it to production yourself.
   Once you're happy, set `AUTO_SEND_TO_PRODUCTION=true` in `functions/.env` and redeploy so
   paid orders go straight to print. Switch to your live Stripe key when you're ready to sell.

A custom domain goes in Firebase console → Hosting → Add custom domain. Update `SITE_URL` to match.

## Settings (`functions/.env`)

| Setting | What it does |
| --- | --- |
| `PRINTIFY_SHOP_ID` | The Printify store the site sells from. |
| `SITE_URL` | The site's address, for Stripe's return links. |
| `FLAT_SHIPPING_CENTS` | Shipping charged per order, in cents (default `599`). |
| `SHIP_COUNTRIES` | Countries you ship to, as comma-separated codes (default `US`). |
| `AUTO_SEND_TO_PRODUCTION` | `true` sends paid orders straight to print; `false` leaves them On hold. |

Shipping is a flat rate because Stripe needs the price before it knows the address. Set it near
your typical Printify shipping cost.

## Working on it

```sh
# See the design with example products, no accounts needed:
cd frontend && VITE_SAMPLE_PRODUCTS=true npm run dev

# The full stack locally (needs functions/.env and functions/.secret.local with the secrets):
npm --prefix functions run build && firebase emulators:start
cd frontend && npm run dev    # proxies /api to the emulators

# Tests for the pricing and order-building logic:
npm --prefix functions test
```

While developing, the storefront shows the example products whenever `/api/products` can't be
reached. A deployed site never does; it shows an error instead.

## If an order doesn't reach Printify

Each checkout has a document in Firestore's `checkouts` collection with its `status`:
`pending` (not paid yet), `submitted` (placed at Printify), `in_production`, or `failed` with
the `error`. Stripe retries failed webhooks for up to three days, so once you fix the setting that
caused the failure, the order goes through on the next retry. You can also resend the event from
the webhook's page in Stripe.

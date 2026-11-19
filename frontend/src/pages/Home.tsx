import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Jokes from "../components/Jokes";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../useProducts";

// The piece of apparel Sir Hippo wears in the hero, and its product in Printify.
const HERO_OUTFIT = { name: "Your Moms Face Square Hoodie", productId: "6ad1af315487ff30db0f2e6c" };

export default function Home() {
  const state = useProducts();
  const { hash } = useLocation();

  useEffect(() => {
    if (hash === "#shop" && state.status !== "loading") {
      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [hash, state.status]);

  return (
    <>
      <section className="hero">
        <div className="wrap hero__inner">
          {/* Sir Hippo models a different piece of the collection in each part of the site. */}
          <Link to={`/products/${HERO_OUTFIT.productId}`} className="hero__figure">
            <img
              className="hero__logo"
              src="/sir-hippo-hero-ymf-hoodie.webp"
              alt={`Sir Hippo leaning on his gold scepter, wearing the ${HERO_OUTFIT.name}`}
              width="560"
              height="758"
            />
            <span className="wearing">Wearing: {HERO_OUTFIT.name} →</span>
          </Link>
          <div className="hero__copy">
            <span className="sticker">Funny. Sarcastic. Cool.</span>
            <h1>
              Heavy is the <span className="hl">Crown</span>
            </h1>
            <p className="lede">
              Royally unbothered tees and hoodies with prints that say what you were already thinking. Every piece is
              printed when you order it, because the king does not wait in line.
            </p>
            <div>
              <Link to="/#shop" className="btn btn--gold">Shop the collection</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="band" id="shop">
        <div className="wrap">
          <div className="sec-head">
            <span className="label">The royal collection · Printed to order</span>
            <h2>Fresh from the throne</h2>
          </div>
          {state.status === "loading" ? <p className="muted">Loading the collection…</p> : null}
          {state.status === "error" ? <p className="notice notice--error">{state.message}</p> : null}
          {state.status === "ready" ? (
            <>
              {state.products.some((p) => p.sample) ? (
                <p className="notice">
                  These are example products. Your Printify catalog replaces them once the shop is connected.
                </p>
              ) : null}
              {state.products.length === 0 ? (
                <p className="muted">New drops are on the way. Check back soon.</p>
              ) : (
                <div className="grid">
                  {state.products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>

      <Jokes />
    </>
  );
}

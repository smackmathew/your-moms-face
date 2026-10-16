import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Contours from "../components/Contours";
import Jokes from "../components/Jokes";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../useProducts";

const SCALE = [
  ["1.0", "Acquaintance", "Recognized at the grocery store. Barely."],
  ["5.0", "Regional", "Appears on local news during a slow week."],
  ["9.0", "Planetary", "Tides adjust out of respect."],
  ["10+", "Your Moms Face", "Instrument maxed out. Needle bent."],
];

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
        <Contours />
        <div className="wrap hero__inner">
          <div className="hero__top">
            <span className="mono">Survey of Notable Landforms · Bulletin No. 1</span>
            <span className="mono">Elev. ∞ ft · Visible from orbit</span>
          </div>
          <h1>
            <span>Your</span>
            <span>Moms</span>
            <span>
              <span className="tag">Face</span>
            </span>
          </h1>
          <p className="lede">
            Apparel for the most studied, most mapped, most talked-about landmark on the playground. Every piece is printed
            when you order it.
          </p>
          <div>
            <Link to="/#shop" className="btn btn--primary">Shop the collection</Link>
          </div>
        </div>
      </section>

      <section className="band" id="shop">
        <div className="wrap">
          <div className="sec-head">
            <span className="mono">Collection · Printed to order</span>
            <h2>The goods</h2>
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
                <p className="muted">Nothing is for sale yet. Publish a product in Printify and it shows up here.</p>
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

      <section className="band">
        <div className="wrap">
          <div className="sec-head">
            <span className="mono">Reference · Face Magnitude Scale</span>
            <h2>How faces are measured</h2>
            <p>Like earthquakes, faces are rated on a logarithmic scale. Each step is ten times more face than the last.</p>
          </div>
          <ol className="scale">
            {SCALE.map(([mag, name, note], i) => (
              <li key={mag} className={i === SCALE.length - 1 ? "max" : undefined}>
                <span className="scale__mag">{mag}</span>
                <span className="scale__name">{name}</span>
                <p>{note}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

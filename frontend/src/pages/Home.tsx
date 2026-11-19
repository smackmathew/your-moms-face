import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Contours from "../components/Contours";
import Jokes from "../components/Jokes";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../useProducts";

const SCALE = [
  ["1.0", "Pond Dweller", "Owns one good hat. Wears it sideways."],
  ["5.0", "Gentleman of the Shallows", "Bows to passing ducks. Ducks bow back."],
  ["9.0", "Lord of the Riverbank", "The crocodiles stand when he enters."],
  ["10+", "Sir Hippo", "Instrument maxed out. Needle politely bent."],
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
            <span className="mono">Survey of the Watering Hole · Bulletin No. 1</span>
            <span className="mono">Depth 5 ft · Wallowing permitted</span>
          </div>
          <h1>
            <span>Sir</span>
            <span>
              <span className="tag">Hippo</span>
            </span>
          </h1>
          <p className="lede">
            Fine apparel for the most distinguished gentleman of the riverbank. Every piece is printed when you order it,
            as Sir Hippo would insist.
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
            <span className="mono">Reference · The Hippo Scale of Distinction</span>
            <h2>How gentlemen are measured</h2>
            <p>Like earthquakes, distinction is rated on a logarithmic scale. Each step is ten times more gentleman than the last.</p>
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

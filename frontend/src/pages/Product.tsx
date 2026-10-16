import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../cart";
import { formatCents } from "../money";
import type { Product } from "../types";
import { useProducts } from "../useProducts";

export default function ProductPage() {
  const { id } = useParams();
  const state = useProducts();

  if (state.status === "loading") return <div className="wrap band"><p className="muted">Loading…</p></div>;
  if (state.status === "error") return <div className="wrap band"><p className="notice notice--error">{state.message}</p></div>;
  const product = state.products.find((p) => p.id === id);
  if (!product) {
    return (
      <div className="wrap band">
        <h2>That item isn't for sale anymore</h2>
        <p><Link to="/#shop">See what is</Link></p>
      </div>
    );
  }
  return <ProductDetail key={product.id} product={product} />;
}

function ProductDetail({ product }: { product: Product }) {
  const cart = useCart();
  // Start on the first in-stock variant.
  const first = product.variants.find((v) => v.available) ?? product.variants[0];
  const [selected, setSelected] = useState<number[]>(() =>
    product.options.map((o) => o.values.find((val) => first.optionIds.includes(val.id))?.id ?? o.values[0].id),
  );
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const variant = useMemo(
    () => product.variants.find((v) => selected.every((id) => v.optionIds.includes(id))),
    [product, selected],
  );
  const image =
    (variant && product.images.find((img) => img.variantIds.includes(variant.id))) ?? product.images[0];
  const [shownImage, setShownImage] = useState<string | null>(null);
  const mainSrc = shownImage ?? image?.src;
  const variantImages = variant ? product.images.filter((img) => img.variantIds.includes(variant.id)) : product.images;

  // Whether picking `valueId` for option `index` (keeping the other picks) lands on something in stock.
  const reachable = (index: number, valueId: number) => {
    const picks = selected.map((id, i) => (i === index ? valueId : id));
    return product.variants.some((v) => v.available && picks.every((id) => v.optionIds.includes(id)));
  };

  const pick = (index: number, valueId: number) => {
    setSelected((prev) => prev.map((id, i) => (i === index ? valueId : id)));
    setShownImage(null);
    setAdded(false);
  };

  const addToCart = () => {
    if (!variant?.available) return;
    cart.add({
      productId: product.id,
      variantId: variant.id,
      quantity,
      title: product.title,
      variantTitle: variant.title,
      priceCents: variant.priceCents,
      image: image?.src,
    });
    setAdded(true);
  };

  return (
    <div className="wrap band product">
      <div className="product__gallery">
        <div className="product__main">{mainSrc ? <img src={mainSrc} alt={product.title} /> : null}</div>
        {variantImages.length > 1 ? (
          <div className="thumbs">
            {variantImages.slice(0, 8).map((img) => (
              <button
                key={img.src}
                type="button"
                className={`thumb${img.src === mainSrc ? " is-active" : ""}`}
                onClick={() => setShownImage(img.src)}
                aria-label="Show this view"
              >
                <img src={img.src} alt="" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="product__info">
        <Link to="/#shop" className="mono">← Collection</Link>
        <h1 className="product__title">{product.title}</h1>
        <p className="product__price">
          {variant ? formatCents(variant.priceCents) : "Not available in this combination"}
        </p>

        {product.options.map((option, index) => (
          <fieldset key={option.name} className="option">
            <legend className="mono">
              {option.name.replace(/s$/, "")}:{" "}
              <strong>{option.values.find((v) => v.id === selected[index])?.title}</strong>
            </legend>
            <div className="option__values">
              {option.values.map((value) => {
                const isColor = option.type === "color" && value.colors?.[0];
                const active = selected[index] === value.id;
                const ok = reachable(index, value.id);
                return (
                  <button
                    key={value.id}
                    type="button"
                    className={`${isColor ? "swatch" : "chip"}${active ? " is-active" : ""}${ok ? "" : " is-out"}`}
                    style={isColor ? { background: value.colors![0] } : undefined}
                    aria-pressed={active}
                    aria-label={isColor ? `${value.title}${ok ? "" : ", out of stock"}` : undefined}
                    title={value.title}
                    onClick={() => pick(index, value.id)}
                  >
                    {isColor ? null : value.title}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div className="buy">
          <label className="qty">
            <span className="mono">Qty</span>
            <select id="qty" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <button type="button" className="btn btn--primary" disabled={!variant?.available} onClick={addToCart}>
            {variant?.available ? "Add to cart" : "Out of stock"}
          </button>
        </div>
        {added ? (
          <p className="notice">
            Added to your cart. <Link to="/cart">Go to cart</Link>
          </p>
        ) : null}

        <div className="product__desc">
          {product.description.split(/\n+/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

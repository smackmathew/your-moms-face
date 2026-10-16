import { Link } from "react-router-dom";
import { formatCents } from "../money";
import type { Product } from "../types";

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const colors = product.options.find((o) => o.type === "color")?.values ?? [];
  const soldOut = product.variants.every((v) => !v.available);
  return (
    <Link to={`/products/${product.id}`} className="card">
      <div className="card__image">
        {image ? <img src={image.src} alt={product.title} loading="lazy" /> : null}
        {soldOut ? <span className="badge">Sold out</span> : null}
      </div>
      <div className="card__body">
        <h3>{product.title}</h3>
        <div className="card__meta">
          <span className="price">from {formatCents(product.minPriceCents)}</span>
          {colors.length > 1 ? <span className="mono">{colors.length} colors</span> : null}
        </div>
      </div>
    </Link>
  );
}

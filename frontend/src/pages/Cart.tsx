import { useState } from "react";
import { Link } from "react-router-dom";
import { startCheckout } from "../api";
import { useCart } from "../cart";
import { formatCents } from "../money";

export default function CartPage() {
  const cart = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async () => {
    setBusy(true);
    setError(null);
    try {
      window.location.href = await startCheckout(cart.lines);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  if (cart.lines.length === 0) {
    return (
      <div className="wrap band">
        <div className="sec-head">
          <span className="mono">Cart</span>
          <h2>Your cart is empty</h2>
        </div>
        <Link to="/#shop" className="btn btn--primary">Shop the collection</Link>
      </div>
    );
  }

  return (
    <div className="wrap band">
      <div className="sec-head">
        <span className="mono">Cart · {cart.count} {cart.count === 1 ? "item" : "items"}</span>
        <h2>Your cart</h2>
      </div>
      <div className="cart">
        <ul className="cart__lines">
          {cart.lines.map((l) => (
            <li key={`${l.productId}:${l.variantId}`} className="line">
              <Link to={`/products/${l.productId}`} className="line__image">
                {l.image ? <img src={l.image} alt="" /> : null}
              </Link>
              <div className="line__info">
                <Link to={`/products/${l.productId}`} className="line__title">{l.title}</Link>
                <span className="mono">{l.variantTitle}</span>
                <div className="line__controls">
                  <div className="stepper" role="group" aria-label={`Quantity of ${l.title}`}>
                    <button type="button" onClick={() => cart.setQuantity(l.productId, l.variantId, l.quantity - 1)} disabled={l.quantity <= 1} aria-label="One fewer">−</button>
                    <span>{l.quantity}</span>
                    <button type="button" onClick={() => cart.setQuantity(l.productId, l.variantId, l.quantity + 1)} disabled={l.quantity >= 20} aria-label="One more">+</button>
                  </div>
                  <button type="button" className="link-btn" onClick={() => cart.remove(l.productId, l.variantId)}>Remove</button>
                </div>
              </div>
              <span className="line__price">{formatCents(l.priceCents * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <aside className="summary">
          <div className="summary__row">
            <span>Subtotal</span>
            <strong>{formatCents(cart.subtotalCents)}</strong>
          </div>
          <p className="muted small">Shipping is added at checkout. Each piece is printed when you order, then ships in 3–7 business days.</p>
          <button type="button" className="btn btn--primary btn--block" onClick={checkout} disabled={busy}>
            {busy ? "Opening checkout…" : "Check out"}
          </button>
          {error ? <p className="notice notice--error">{error}</p> : null}
        </aside>
      </div>
    </div>
  );
}

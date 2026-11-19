import { Link } from "react-router-dom";
import { useCart } from "../cart";

export default function Header() {
  const { count } = useCart();
  return (
    <header className="site-header">
      <div className="wrap site-header__row">
        <Link to="/" className="brand" aria-label="Sir Hippo home">
          <img src="/sir-hippo-logo-sm.webp" alt="Sir Hippo" width="72" height="66" />
        </Link>
        <nav className="site-nav">
          <Link to="/#shop" className="nav-link">Shop</Link>
          <Link to="/cart" className="cart-link" aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}>
            Cart <span className="cart-count">{count}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

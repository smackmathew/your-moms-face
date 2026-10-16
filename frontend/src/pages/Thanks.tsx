import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../cart";

export default function Thanks() {
  const { clear } = useCart();
  const [params] = useSearchParams();
  const paid = params.has("session_id");

  useEffect(() => {
    if (paid) clear();
  }, [paid]);

  return (
    <div className="wrap band">
      <div className="sec-head">
        <span className="mono">Order received</span>
        <h2>Thanks. Your order is going to print.</h2>
        <p>
          A receipt is on its way to your email. Each piece is printed for you, so it ships in 3–7 business days, and
          you'll get tracking by email when it does.
        </p>
      </div>
      <Link to="/#shop" className="btn">Keep shopping</Link>
    </div>
  );
}

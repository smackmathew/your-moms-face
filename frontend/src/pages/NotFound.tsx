import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="wrap band">
      <div className="sec-head">
        <span className="label">Error 404</span>
        <h2>Even royalty gets lost sometimes</h2>
        <p>This page doesn't exist. The shop does.</p>
      </div>
      <Link to="/" className="btn">Back to the shop</Link>
    </div>
  );
}

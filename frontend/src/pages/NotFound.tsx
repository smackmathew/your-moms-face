import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="wrap band">
      <div className="sec-head">
        <span className="mono">Error 404 · Off the map</span>
        <h2>This page isn't on the survey</h2>
      </div>
      <Link to="/" className="btn">Back to the start</Link>
    </div>
  );
}

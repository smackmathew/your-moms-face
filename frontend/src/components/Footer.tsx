export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__row">
        <span className="label">© {new Date().getFullYear()} Sir Hippo · Printed to order</span>
        <span className="label">Ships in 3–7 business days · Heavy is the Crown</span>
      </div>
    </footer>
  );
}

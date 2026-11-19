export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__row">
        <span className="mono">© {new Date().getFullYear()} Sir Hippo · Printed to order</span>
        <span className="mono">Ships in 3–7 business days · Hats off, gentlemen</span>
      </div>
    </footer>
  );
}

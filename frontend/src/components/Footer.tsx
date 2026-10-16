export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__row">
        <span className="mono">© {new Date().getFullYear()} Your Moms Face · Printed to order</span>
        <span className="mono">Ships in 3–7 business days · Made with love, mostly</span>
      </div>
    </footer>
  );
}

import ContactLinks from "./contact-links";

export default function SiteFooter() {
  return <footer className="site-footer">
    <nav className="footer-links" aria-label="Contact links"><ContactLinks /></nav>
    <p className="footer-dedication">God Almighty</p>
  </footer>;
}

export default function SiteHeader({ active }: { active?: "contact" | "about" }) {
  return <header className="site-header">
    <a className="wordmark" href="/" aria-label="Yousef Husari home">Yousef Husari</a>
    <nav aria-label="Main navigation">
      <a className="nav-link" href="/contact" aria-current={active === "contact" ? "page" : undefined}>Contact</a>
      <a className="nav-link" href="/about" aria-current={active === "about" ? "page" : undefined}>About</a>
    </nav>
  </header>;
}

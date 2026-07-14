import Link from 'next/link';

export function Footer() {
  return <footer className="site-footer">
    <div><div className="footer-mark">DROBE<span>233</span></div><p>Style, delivered.<br/>Serving customers across Accra.</p></div>
    <div><h3>Shop</h3><Link href="/shop">All clothing</Link><Link href="/shop?category=Women">Women</Link><Link href="/shop?category=Men">Men</Link></div>
    <div><h3>Help</h3><Link href="/policies/delivery">Delivery</Link><Link href="/policies/returns">Returns</Link><Link href="/policies/privacy">Privacy</Link><Link href="/policies/terms">Terms</Link></div>
    <div><h3>Talk to us</h3><a href="mailto:hello@example.com">hello@example.com</a><a href="tel:+233200000000">+233 20 000 0000</a><p>Mon–Sat, 9am–6pm</p></div>
    <small>© {new Date().getFullYear()} Drobe 233. Mock catalog for launch preparation.</small>
  </footer>;
}

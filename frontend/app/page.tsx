import Image from 'next/image';
import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import { ArrowIcon } from '@/components/icons';
import { products } from '@/lib/catalog';

export default function Home() {
  const featured = products.filter((p) => p.featured);
  return <>
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow">The July edit · 2026</p><h1>Ease,<br/><em>beautifully</em> made.</h1><p>Quietly confident pieces designed for warm days, late nights, and everything between.</p><Link className="button light" href="/shop">Shop the collection <ArrowIcon /></Link></div>
      <div className="hero-image"><Image src="/products/blazer.png" alt="Tailored sand blazer" fill priority sizes="(max-width: 800px) 100vw, 55vw" /></div>
    </section>
    <section className="section featured"><div className="section-heading"><div><p className="eyebrow">Just landed</p><h2>New in</h2></div><Link href="/shop">View all <ArrowIcon /></Link></div><div className="product-grid">{featured.map((p) => <ProductCard key={p.id} product={p} />)}</div></section>
    <section className="story-banner"><div className="story-image"><Image src="/products/dress.png" alt="Black midi dress" fill sizes="50vw" /></div><div className="story-copy"><p className="eyebrow">The GhanaStyle approach</p><h2>Less noise.<br/>Better clothes.</h2><p>We build wardrobes around versatile silhouettes, considered materials, and pieces you will reach for again and again.</p><Link className="text-link" href="/shop">Discover the edit <ArrowIcon /></Link></div></section>
    <section className="promise-grid"><div><b>01</b><h3>Easy delivery</h3><p>Clear delivery pricing and updates from checkout to your door.</p></div><div><b>02</b><h3>Secure payment</h3><p>Pay safely by Mobile Money or card through our payment partner.</p></div><div><b>03</b><h3>Human support</h3><p>Real help by phone, email, or WhatsApp when you need it.</p></div></section>
  </>;
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import { getCatalog } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Shop' };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const products = await getCatalog();
  const filtered = category ? products.filter((p) => p.category === category) : products;
  const categories = [...new Set(products.map((product) => product.category))];
  return <div className="shop-page section">
    <div className="shop-intro"><p className="eyebrow">The collection</p><h1>{category || 'Shop all'}</h1><p>Modern staples and confident silhouettes, selected for an effortless wardrobe.</p></div>
    <div className="shop-toolbar"><div className="filters"><Link className={!category ? 'active' : ''} href="/shop">All</Link>{categories.map((item) => <Link className={category === item ? 'active' : ''} href={`/shop?category=${encodeURIComponent(item)}`} key={item}>{item}</Link>)}</div><span>{filtered.length} pieces</span></div>
    <div className="product-grid shop-grid">{filtered.map((p) => <ProductCard key={p.id} product={p} />)}</div>
  </div>;
}

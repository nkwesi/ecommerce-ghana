import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/product-detail';
import { ProductCard } from '@/components/product-card';
import { getProduct, products } from '@/lib/catalog';

export function generateStaticParams() { return products.map((p) => ({ slug: p.slug })); }

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const product = getProduct(slug); if (!product) notFound();
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);
  return <>
    <div className="breadcrumb"><Link href="/shop">Shop</Link><span>/</span><span>{product.name}</span></div>
    <section className="product-page"><div className="product-gallery"><div><Image src={product.image} alt={product.name} fill priority sizes="(max-width: 800px) 100vw, 58vw" /></div></div><ProductDetail product={product} /></section>
    <section className="section related"><div className="section-heading"><h2>You may also like</h2></div><div className="product-grid three">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div></section>
  </>;
}

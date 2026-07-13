import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/catalog';
import { formatGHS } from '@/lib/catalog';

export function ProductCard({ product }: { product: Product }) {
  return <article className="product-card">
    <Link href={`/shop/${product.slug}`} className="product-image-wrap">
      {product.badge && <span className="product-badge">{product.badge}</span>}
      <Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 50vw, 25vw" className="product-image" />
    </Link>
    <div className="product-meta"><div><Link href={`/shop/${product.slug}`}>{product.name}</Link><span>{product.category}</span></div><p>{formatGHS(product.price)}</p></div>
  </article>;
}

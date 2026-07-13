'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/lib/catalog';
import { formatGHS } from '@/lib/catalog';
import { useCart } from './cart-provider';

export function ProductDetail({ product }: { product: Product }) {
  const colors = Array.from(new Map(product.variants.map((v) => [v.color, v])).values());
  const [color, setColor] = useState(colors[0].color);
  const available = useMemo(() => product.variants.filter((v) => v.color === color), [product, color]);
  const [size, setSize] = useState(available[0].size);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const selected = product.variants.find((v) => v.color === color && v.size === size) || available[0];

  function changeColor(next: string) { setColor(next); const first = product.variants.find((v) => v.color === next); if (first) setSize(first.size); }
  function add() { addItem(product, selected); setAdded(true); setTimeout(() => setAdded(false), 1800); }

  return <div className="product-details">
    <p className="eyebrow">{product.category}</p><h1>{product.name}</h1>
    <div className="detail-price">{formatGHS(selected.price)} {product.compareAtPrice && <s>{formatGHS(product.compareAtPrice)}</s>}</div>
    <p className="detail-description">{product.description}</p>
    <div className="option"><div><b>Colour</b><span>{color}</span></div><div className="swatches">{colors.map((v) => <button key={v.color} className={color === v.color ? 'active' : ''} style={{ '--swatch': v.colorHex } as React.CSSProperties} onClick={() => changeColor(v.color)} aria-label={v.color} />)}</div></div>
    <div className="option"><div><b>Size</b><a href="#size-guide">Size guide</a></div><div className="sizes">{available.map((v) => <button key={v.id} className={size === v.size ? 'active' : ''} onClick={() => setSize(v.size)}>{v.size}</button>)}</div></div>
    <button className="button primary full" onClick={add}>{added ? 'Added to bag ✓' : 'Add to bag'}</button>
    <p className="stock-note"><i /> In stock · Usually dispatched in 1–2 working days</p>
    <details open><summary>Details & care</summary><p>Mock product details. Replace with final composition, measurements, origin, and care instructions before launch.</p></details>
    <details><summary>Delivery & returns</summary><p>Delivery fees are shown at checkout. Unworn items may be returned under the published returns policy.</p></details>
  </div>;
}

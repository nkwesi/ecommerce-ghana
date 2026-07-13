'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/cart-provider';
import { formatGHS } from '@/lib/catalog';

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  if (!items.length) return <div className="empty-state"><p className="eyebrow">Your bag</p><h1>Nothing here yet.</h1><p>Start with the new collection and find something that feels like you.</p><Link className="button primary" href="/shop">Explore the collection</Link></div>;
  return <section className="cart-page section"><div className="page-title"><p className="eyebrow">Your selection</p><h1>Shopping bag</h1></div><div className="cart-layout"><div className="cart-items">{items.map((item) => <article className="cart-item" key={item.variant.id}><Link href={`/shop/${item.product.slug}`} className="cart-thumb"><Image src={item.product.image} alt={item.product.name} fill sizes="140px" /></Link><div className="cart-info"><div><Link href={`/shop/${item.product.slug}`}><h2>{item.product.name}</h2></Link><p>{item.variant.color} · {item.variant.size}</p><span>{item.variant.sku}</span></div><div className="cart-actions"><label>Qty <select value={item.quantity} onChange={(e) => updateQuantity(item.variant.id, Number(e.target.value))}>{Array.from({ length: Math.min(item.variant.stock, 8) }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></label><button onClick={() => removeItem(item.variant.id)}>Remove</button></div></div><strong>{formatGHS(item.variant.price * item.quantity)}</strong></article>)}</div><aside className="order-summary"><h2>Order summary</h2><div><span>Subtotal</span><b>{formatGHS(subtotal)}</b></div><div><span>Delivery</span><span>Calculated at checkout</span></div><div className="summary-total"><span>Estimated total</span><b>{formatGHS(subtotal)}</b></div><p>Taxes, if applicable, and delivery are confirmed at checkout.</p><Link href="/checkout" className="button primary full">Continue to checkout</Link><Link href="/shop" className="continue">Continue shopping</Link></aside></div></section>;
}

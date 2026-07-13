'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatGHS } from '@/lib/catalog';
import { getOrder } from '@/lib/api';

type DisplayOrder = { orderNumber: string; email?: string; name?: string; customerName?: string; total: number; status: string; items: Array<{ product?: { name: string }; productName?: string; variant?: { color: string; size: string }; color?: string; size?: string; quantity: number }> };

export default function OrderPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>(); const search = useSearchParams(); const [order, setOrder] = useState<DisplayOrder | null | undefined>(undefined);
  useEffect(() => {
    const raw = localStorage.getItem(`ghanastyle-order-${orderNumber}`);
    if (raw) { setOrder(JSON.parse(raw)); return; }
    const email = search.get('email') || localStorage.getItem('ghanastyle-last-email');
    if (!email) { setOrder(null); return; }
    getOrder(orderNumber, email).then((result) => setOrder(result as unknown as DisplayOrder)).catch(() => setOrder(null));
  }, [orderNumber, search]);
  if (order === undefined) return <div className="empty-state"><p>Loading your order…</p></div>;
  if (!order) return <div className="empty-state"><h1>Order not found.</h1><p>Check the order number or contact our support team.</p><Link className="button primary" href="/shop">Return to shop</Link></div>;
  return <section className="order-success"><div className="success-mark">✓</div><p className="eyebrow">Order received</p><h1>Thank you{order.name || order.customerName ? `, ${order.name || order.customerName}` : ''}.</h1><p>Your order has been recorded. Payment status can take a moment to update after Mobile Money authorization.</p><div className="order-card"><div><span>Order number</span><b>{order.orderNumber}</b></div><div><span>Status</span><b>{order.status}</b></div>{order.email && <div><span>Contact</span><b>{order.email}</b></div>}<div><span>Total</span><b>{formatGHS(Number(order.total))}</b></div><hr/>{order.items.map((item, index) => <p key={index}><span>{item.quantity} × {item.product?.name || item.productName}<small>{item.variant?.color || item.color} · {item.variant?.size || item.size}</small></span></p>)}</div><div className="success-actions"><Link href="/shop" className="button primary">Continue shopping</Link><a href="mailto:hello@example.com" className="button outline">Contact support</a></div></section>;
}

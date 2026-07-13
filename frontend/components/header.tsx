'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from './cart-provider';
import { BagIcon, MenuIcon } from './icons';

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  return <>
    <div className="announcement">Free Accra delivery on orders over GH₵500</div>
    <header className="site-header">
      <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle menu"><MenuIcon /></button>
      <Link href="/" className="wordmark">GHANA<span>STYLE</span></Link>
      <nav className={open ? 'nav open' : 'nav'} onClick={() => setOpen(false)}>
        <Link href="/shop">New arrivals</Link><Link href="/shop?category=Women">Women</Link><Link href="/shop?category=Men">Men</Link><Link href="/shop?category=Essentials">Essentials</Link>
      </nav>
      <Link href="/cart" className="cart-link" aria-label={`Cart with ${count} items`}><BagIcon /><span>Bag</span>{count > 0 && <b>{count}</b>}</Link>
    </header>
  </>;
}

import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/components/cart-provider';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: { default: 'GhanaStyle — Considered clothing', template: '%s — GhanaStyle' },
  description: 'Modern, considered clothing designed for life in Ghana.',
  metadataBase: new URL('https://example.com'),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><CartProvider><Header /><main>{children}</main><Footer /></CartProvider></body></html>;
}

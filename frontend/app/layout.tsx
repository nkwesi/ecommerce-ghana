import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/components/cart-provider';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ghanastyle-storefront.vercel.app';

export const metadata: Metadata = {
  title: { default: 'Drobe 233 — Style, delivered', template: '%s — Drobe 233' },
  description: 'Modern clothing delivered across Accra.',
  metadataBase: new URL(siteUrl),
  applicationName: 'Drobe 233',
  openGraph: {
    type: 'website',
    siteName: 'Drobe 233',
    title: 'Drobe 233 — Style, delivered',
    description: 'Modern clothing delivered across Accra.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary',
    title: 'Drobe 233 — Style, delivered',
    description: 'Modern clothing delivered across Accra.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><CartProvider><Header /><main>{children}</main><Footer /></CartProvider></body></html>;
}

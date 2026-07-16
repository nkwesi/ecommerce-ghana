import type { MetadataRoute } from 'next';
import { products } from '@/lib/catalog';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ghanastyle-storefront.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ['', '/shop', '/policies/delivery', '/policies/returns', '/policies/privacy', '/policies/terms'];
  return [
    ...staticPages.map((path) => ({ url: `${siteUrl}${path}`, changeFrequency: 'weekly' as const })),
    ...products.map((product) => ({
      url: `${siteUrl}/shop/${product.slug}`,
      changeFrequency: 'weekly' as const,
    })),
  ];
}

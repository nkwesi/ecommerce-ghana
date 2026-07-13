export type Variant = {
  id: string;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  price: number;
  stock: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: 'Women' | 'Men' | 'Essentials';
  description: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  badge?: string;
  featured?: boolean;
  variants: Variant[];
};

const sizes = ['S', 'M', 'L', 'XL'];

function variants(slug: string, price: number, colors: Array<[string, string]>, customSizes = sizes): Variant[] {
  return colors.flatMap(([color, colorHex], colorIndex) =>
    customSizes.map((size, sizeIndex) => ({
      id: `${slug}-${colorIndex}-${sizeIndex}`,
      sku: `${slug.replaceAll('-', '').toUpperCase()}-${color.slice(0, 3).toUpperCase()}-${size}`,
      size,
      color,
      colorHex,
      price,
      stock: 4 + ((colorIndex + sizeIndex) % 5),
    })),
  );
}

export const products: Product[] = [
  {
    id: 'mock-dress', slug: 'the-ama-midi-dress', name: 'The Ama Midi Dress', category: 'Women',
    description: 'A clean, sculpted midi with an easy drape. Designed for warm afternoons and polished evenings.',
    price: 390, compareAtPrice: 450, image: '/products/dress.png', badge: 'New', featured: true,
    variants: variants('ama-midi', 390, [['Midnight', '#171717'], ['Cocoa', '#6b4435']]),
  },
  {
    id: 'mock-shirt', slug: 'relaxed-poplin-shirt', name: 'Relaxed Poplin Shirt', category: 'Men',
    description: 'Breathable cotton poplin cut with a relaxed shoulder and a crisp, versatile finish.',
    price: 245, image: '/products/shirt.png', featured: true,
    variants: variants('poplin-shirt', 245, [['Cloud', '#f1eee8'], ['Sky', '#8aa7be']]),
  },
  {
    id: 'mock-blazer', slug: 'osu-tailored-blazer', name: 'Osu Tailored Blazer', category: 'Women',
    description: 'An unlined tailored layer with a confident silhouette and lightweight construction.',
    price: 620, image: '/products/blazer.png', badge: 'Limited', featured: true,
    variants: variants('osu-blazer', 620, [['Sand', '#c5aa86'], ['Ink', '#24252a']]),
  },
  {
    id: 'mock-tee', slug: 'everyday-weight-tee', name: 'Everyday Weight Tee', category: 'Essentials',
    description: 'A substantial cotton tee with a soft hand feel, neat neckline, and easy everyday shape.',
    price: 135, image: '/products/tee.png', badge: 'Bestseller', featured: true,
    variants: variants('weight-tee', 135, [['Black', '#171717'], ['Ivory', '#eee9df'], ['Clay', '#a55f45']]),
  },
  {
    id: 'mock-pants', slug: 'wide-leg-trouser', name: 'Wide-Leg Trouser', category: 'Women',
    description: 'Fluid high-rise trousers made to move, with a clean waistband and full-length leg.',
    price: 320, image: '/products/pants.png',
    variants: variants('wide-trouser', 320, [['Espresso', '#3a2925'], ['Olive', '#6d7052']], ['8', '10', '12', '14', '16']),
  },
  {
    id: 'mock-cardigan', slug: 'soft-knit-cardigan', name: 'Soft Knit Cardigan', category: 'Women',
    description: 'A breathable fine knit for cool evenings, finished with tonal buttons and a relaxed cuff.',
    price: 285, image: '/products/cardigan.png',
    variants: variants('knit-cardigan', 285, [['Oat', '#d4c5ad'], ['Wine', '#6c2638']]),
  },
  {
    id: 'mock-jacket', slug: 'utility-overshirt', name: 'Utility Overshirt', category: 'Men',
    description: 'A structured cotton overshirt with practical pockets and enough room for layering.',
    price: 410, image: '/products/jacket.png', badge: 'New',
    variants: variants('utility-shirt', 410, [['Forest', '#3e4d3b'], ['Stone', '#8a8175']]),
  },
  {
    id: 'mock-skirt', slug: 'column-midi-skirt', name: 'Column Midi Skirt', category: 'Women',
    description: 'A minimal column skirt with a comfortable back vent and an elegant, close fit.',
    price: 260, image: '/products/skirt.png',
    variants: variants('column-skirt', 260, [['Black', '#171717'], ['Merlot', '#682b3a']], ['8', '10', '12', '14', '16']),
  },
  {
    id: 'mock-sweater', slug: 'textured-crew-knit', name: 'Textured Crew Knit', category: 'Men',
    description: 'A refined crew-neck knit with a subtle texture and comfortable midweight feel.',
    price: 310, image: '/products/sweater.png',
    variants: variants('crew-knit', 310, [['Charcoal', '#4d4d4d'], ['Cream', '#e8dfcf']]),
  },
  {
    id: 'mock-top', slug: 'draped-neck-top', name: 'Draped Neck Top', category: 'Women',
    description: 'A softly draped top that dresses up denim and pairs effortlessly with tailoring.',
    price: 195, image: '/products/top.png',
    variants: variants('draped-top', 195, [['Pearl', '#e6ddd0'], ['Cocoa', '#735044']]),
  },
  {
    id: 'mock-coat', slug: 'lightweight-city-coat', name: 'Lightweight City Coat', category: 'Women',
    description: 'A polished, light layer with a long line and understated details for everyday wear.',
    price: 720, image: '/products/coat.png', badge: 'Limited',
    variants: variants('city-coat', 720, [['Camel', '#b58c64'], ['Black', '#171717']]),
  },
  {
    id: 'mock-shorts', slug: 'tailored-weekend-shorts', name: 'Tailored Weekend Shorts', category: 'Men',
    description: 'Clean-cut cotton shorts designed for easy weekends and warm days in the city.',
    price: 210, image: '/products/shorts.png',
    variants: variants('weekend-shorts', 210, [['Khaki', '#b8a27e'], ['Navy', '#273448']], ['30', '32', '34', '36', '38']),
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatGHS(value: number) {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(value);
}

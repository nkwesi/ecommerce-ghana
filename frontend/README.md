# Drobe 233 storefront

This is the launch storefront rebuilt as a normal Next.js application. It currently uses a local mock catalog so the customer experience can be tested before final inventory arrives.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Checkout modes

- `NEXT_PUBLIC_CHECKOUT_MODE=demo`: creates a local browser-only test order and never charges money.
- `NEXT_PUBLIC_CHECKOUT_MODE=api`: reserves each cart SKU through the backend, creates an order, and redirects to the checkout URL returned by the API. The backend must use `PAYMENT_MODE=paystack` in production.

Do not deploy public sales with either the frontend checkout mode or backend payment mode accidentally set to `demo`.

## Replace mock products

The temporary catalog is in `lib/catalog.ts`; product images are in `public/products`.

For each real product, replace its identity, description, pricing, image paths, and every variant's stable SKU, size, color, price, and stock. Replace mock care text with real composition, measurements, origin, and care instructions.

The backend database must contain matching SKUs before enabling API checkout because inventory reservations are created by SKU.

## Required launch substitutions

- Store name/logo and brand metadata
- Support email, phone, WhatsApp, and operating hours
- Delivery areas, fees, timing, and free-delivery threshold
- Accountant-confirmed tax treatment
- Approved privacy, delivery, returns, and terms wording
- Production domain in metadata and environment settings

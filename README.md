# Drobe 233 E-commerce Platform

A full-stack e-commerce platform for Ghana-based clothing retail with physical store inventory integration.

## Tech Stack

- **Backend**: NestJS (TypeScript)
- **Frontend**: Next.js 15 (React, TypeScript, Tailwind CSS)
- **Database**: PostgreSQL
- **Cache**: Redis (optional)
- **Payments**: Paystack-ready hosted checkout (explicit demo mode for development)

## Features

### Core E-commerce
- ✅ Product catalog with variants (size/color)
- ✅ Real-time stock tracking across stores
- ✅ **Atomic inventory reservations** (prevents overselling)
- ✅ Shopping cart with 10-minute reservation timer
- ✅ Guest checkout (no account required)
- ✅ Order tracking

### Inventory System
- ✅ Multi-store inventory management
- ✅ Sellable stock calculation (physical - reserved - buffer)
- ✅ Automatic reservation expiry
- ✅ Store selection for fulfillment

### Payment Processing
- ✅ Paystack-ready transaction initialization and signed webhook confirmation
- ✅ **Webhook-driven order confirmation** (secure)
- ✅ Idempotent webhook handling
- ✅ Payment success/failure simulation

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)

### 1. Database Setup

Production uses Supabase Postgres. See [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for the connection, SSL, migration, and seeding workflow. Local PostgreSQL is still supported.

```bash
# Create database
psql -U postgres
CREATE DATABASE ecommerce_ghana;
\q
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start development server
npm run start:dev
```

Backend runs on http://localhost:3001

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on http://localhost:3000

### 4. Seed Sample Data

```bash
cd backend
npx ts-node src/database/seed.ts
```

## Project Structure

```
ecommerce-ghana/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── config/            # App configuration
│   │   ├── modules/
│   │   │   ├── products/      # Product catalog
│   │   │   ├── inventory/     # Stock & reservations
│   │   │   ├── orders/        # Checkout & orders
│   │   │   ├── payments/      # Paystack integration
│   │   │   └── tasks/         # Scheduled jobs
│   │   └── database/          # Seed scripts
│   └── .env
│
├── frontend/                   # Next.js App
│   ├── app/
│   │   ├── products/          # Product pages
│   │   ├── cart/              # Shopping cart
│   │   ├── checkout/          # Checkout flow
│   │   └── orders/            # Order confirmation
│   ├── components/            # UI components
│   ├── lib/                   # API, store, utils
│   └── .env.local
```

## API Endpoints

### Products
- `GET /api/v1/products` - List products
- `GET /api/v1/products/:slug` - Product details

### Inventory
- `GET /api/v1/inventory/stock/:sku` - Check stock
- `POST /api/v1/inventory/reserve` - Create reservation
- `POST /api/v1/inventory/reserve/:id/release` - Release reservation

### Orders
- `POST /api/v1/checkout` - Process checkout
- `GET /api/v1/orders/:orderNumber` - Get order

### Webhooks
- `POST /api/v1/webhooks/paystack` - Paystack payment webhooks
- `POST /api/v1/webhooks/test/success` - Simulate success (dev only)
- `POST /api/v1/webhooks/test/failure` - Simulate failure (dev only)

## Ghana-Specific Configuration

- **Currency**: GHS (Ghana Cedi) - `₵`
- **VAT**: 12.5%
- **Country Code**: GH
- **Shipping**: Free over ₵500, otherwise ₵25

## Testing the Flow

1. Browse products at http://localhost:3000/products
2. Click a product to view details
3. Select size/color and click "Add to Cart"
4. Notice the 10-minute reservation timer
5. Proceed to checkout
6. Fill in contact and shipping info
7. In demo mode, create a charge-free test order
8. In API mode, continue to hosted Paystack checkout
9. View order confirmation and status

## Key Design Decisions

### Inventory Reservations
When a customer adds an item to cart, we:
1. Check sellable stock (physical - active reservations - buffer)
2. Create a reservation with 10-minute expiry
3. Link reservation to session
4. On payment success: convert reservation (permanent)
5. On expiry/cancel: release reservation (stock returns)

### Payment Security
- **Never trust frontend** for payment confirmation
- All order status changes via **webhooks only**
- Webhook signature verification
- Idempotent event processing (store event IDs)

### Order Snapshots
- Order items snapshot product data at purchase time
- Protects against product changes after purchase
- SKU, name, size, color all preserved

## Environment Variables

### Backend (.env)
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ecommerce_ghana
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Production alternative (Supabase Session pooler)
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
DATABASE_SSL=true

REDIS_HOST=localhost
REDIS_PORT=6379

PORT=3001
NODE_ENV=development

POLAR_API_KEY=test_key_mock
POLAR_WEBHOOK_SECRET=whsec_test
POLAR_MODE=test

COUNTRY_CODE=GH
CURRENCY=GHS
VAT_RATE=0 # Confirm tax treatment with an accountant before launch
DEFAULT_RESERVATION_MINUTES=10
STOCK_SAFETY_BUFFER=1
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_CURRENCY=GHS
NEXT_PUBLIC_CURRENCY_SYMBOL=₵
```

## Next Steps

To complete production readiness:

1. **Inventory Sync**: Implement sync from your POS/ERP system
2. **Paystack Activation**: Complete merchant verification and configure production credentials
3. **Email Notifications**: Implement order confirmation emails
4. **Admin Dashboard**: Build order management interface
5. **Authentication**: Add admin user authentication
6. **Testing**: Add unit and integration tests
7. **Monitoring**: Set up logging and error tracking

## License

MIT

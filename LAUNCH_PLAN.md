# GhanaStyle 3-Day Launch Plan

Target launch: **Thursday, 16 July 2026**

## Current readiness

Status: **Demo storefront and Supabase database complete; payments, deployment, and business inputs are still required before accepting real orders.**

Completed in the first implementation pass:

- [x] Replaced the broken frontend submodule with a mobile-first Next.js storefront.
- [x] Added a 12-product mock catalog with sizes, colors, SKUs, stock, and reusable product assets.
- [x] Added product browsing, cart persistence, delivery checkout, demo confirmation, customer policies, and staff order UI.
- [x] Added a Paystack-ready checkout mode while keeping local development explicitly charge-free.
- [x] Corrected double-prefixed API routes and added checkout DTO validation.
- [x] Protected admin order routes and required email verification for public order lookup.
- [x] Made webhook signatures mandatory and restricted payment simulation/admin setup in production.
- [x] Added production secret/CORS checks, a health endpoint, successful production builds, and HTTP route smoke checks.
- [x] Updated the default tax rate to zero until accountant-confirmed treatment is configured.
- [x] Cleared the backend dependency audit with non-breaking updates.
- [x] Created and linked the GhanaStyle Supabase project, applied reviewed migrations, enabled RLS, and loaded the matching mock catalog and inventory.
- [x] Verified 12 products, 106 variants, and 318 inventory rows through both SQL and the running backend API; Supabase's security advisor reports no issues.

Remaining launch blockers:

- Paystack merchant credentials and a real low-value Mobile Money/card test
- Production deployment, domain, HTTPS, Supabase backups, logs, and alerts
- Real business identity, support details, delivery fees/areas, VAT treatment, and approved policy wording
- Customer confirmation and internal new-order notification provider credentials
- Final visual browser/device QA (the in-app browser was unavailable during the first implementation pass)

## Launch scope

The three-day launch should include only:

- Mobile-first home, shop, product, cart, checkout, payment result, and order-status pages
- A small curated catalog of 10-30 clothing products with size/color variants
- Guest checkout
- Paystack-hosted checkout for Mobile Money and cards
- Delivery within explicitly supported Ghana locations, with simple flat or zone-based fees
- Stock control that prevents selling unavailable variants
- Customer order confirmation and an internal new-order alert
- A protected way for staff to view orders and change fulfillment status
- Privacy, returns/refunds, delivery, and terms pages
- Production hosting, HTTPS, backups, logs, error monitoring, and basic analytics

Defer until after launch: saved cards, customer OTP accounts, wishlists, reviews, coupons, advanced search, automated POS sync, multi-store optimization, a polished admin dashboard, advanced analytics, and promotional video work.

## Day 1 - Restore the buying experience and stabilize the API

### Business inputs due in the first hour

- [x] Rebuild the unavailable storefront as normal tracked project files
- [ ] Provide logo, brand colors, store name, support phone/WhatsApp, email, pickup address, and social links
- [ ] Provide launch catalog: SKU, name, description, category, GHS price, sizes, colors, per-variant stock, and 2-4 optimized images per product
- [ ] Define delivery areas, price per area, delivery times, free-shipping rule, and whether pickup is allowed
- [ ] Approve returns/refunds, privacy, terms, and delivery wording
- [ ] Confirm VAT registration status and pricing treatment with an accountant
- [ ] Start/complete Paystack merchant verification and obtain test/live credentials
- [ ] Confirm domain and hosting accounts

### Engineering

- [x] Recover or create the Next.js storefront and implement the launch pages
- [x] Fix all double-prefixed API routes and add an API health endpoint
- [x] Replace inline checkout request types with validated DTOs
- [x] Remove production defaults for JWT/admin/payment secrets and fail startup when required variables are missing
- [x] Restrict CORS to configured storefront domains
- [x] Disable payment simulation and admin setup routes in production
- [x] Require valid webhook signatures; keep payment handling idempotent
- [x] Add production database migrations; do not use schema synchronization in production
- [x] Import and verify the mock catalog, images, prices, variants, and stock in Supabase
- [ ] Add smoke tests for catalog, reservation, checkout, order lookup, and protected admin access

Exit gate: A customer can browse the real catalog, add a specific size/color to cart, enter delivery details, and reach a test payment page on mobile.

## Day 2 - Real payments, notifications, and production deployment

### Payments and orders

- [ ] Replace the Polar mock with Paystack server-side transaction initialization
- [ ] Store money as integer pesewas during payment calculations and verify amount, currency, reference, and order before marking paid
- [ ] Implement and test Paystack webhook signature validation and transaction verification fallback
- [ ] Handle success, failure, abandonment, delayed Mobile Money confirmation, duplicate events, and expired reservations
- [ ] Show a clear pending state instead of treating a redirect as proof of payment
- [ ] Send a customer receipt/order confirmation and an internal new-order alert

### Production

- [ ] Deploy frontend, API, and managed PostgreSQL; configure HTTPS and the custom domain
- [ ] Set production environment variables and rotate any credentials used during development
- [ ] Configure database backups, uptime monitoring, structured logs, and error alerts
- [ ] Add robots metadata, sitemap, social preview, favicon, contact details, and basic analytics
- [ ] Confirm admin login and a simple fulfillment flow: paid -> processing -> dispatched/ready -> delivered
- [ ] Document manual fallback for payment or notification outages

Exit gate: A low-value live Mobile Money/card payment creates exactly one paid order, decrements the correct stock once, sends both notifications, and appears in the staff order view.

## Day 3 - QA, operations rehearsal, and soft launch

### Test matrix

- [ ] Test Android and iPhone layouts on slow mobile data
- [ ] Test Chrome and Safari at minimum
- [ ] Test every product variant, out-of-stock behavior, cart expiry, delivery fee, and total calculation
- [ ] Test successful, failed, abandoned, delayed, and duplicate payment events
- [ ] Test an incorrect amount/currency/reference and confirm the order is not marked paid
- [ ] Test confirmation email/alert delivery and order lookup privacy
- [ ] Test admin permissions and remove/lock the admin setup path
- [ ] Run a real fulfillment rehearsal from purchase through delivery update and refund handling
- [ ] Reconcile displayed stock with physical stock immediately before opening

### Release sequence

- [ ] Freeze non-launch features by midday
- [ ] Fix only launch-blocking defects
- [ ] Back up the database and export the initial catalog/stock snapshot
- [ ] Soft-launch to 5-10 trusted customers for two hours
- [ ] Review payment dashboard, logs, alerts, orders, stock, and customer feedback
- [ ] Open publicly only after every launch gate below passes

## Non-negotiable launch gates

Do not open public sales unless all are true:

- [ ] Storefront and API are accessible over HTTPS on production domains
- [ ] Live Mobile Money or card payment has been completed and reconciled
- [ ] An order cannot be marked paid by the browser alone or by an unsigned webhook
- [ ] Correct price, delivery, tax treatment, and final total are shown before payment
- [ ] Correct variant stock is decremented exactly once and out-of-stock items cannot be bought
- [ ] Staff receive new-order alerts and can access customer delivery details securely
- [ ] Customer receives an order number and support contact
- [ ] Returns/refunds, privacy, delivery, and terms pages are visible
- [ ] Database backups and error/uptime alerts are active
- [ ] At least one complete order-to-fulfillment rehearsal has passed

## Launch-day operating rhythm

- Keep one person responsible for orders/support and one person responsible for technical monitoring.
- Check new orders against Paystack before fulfillment; never rely on a customer screenshot.
- Review failed/pending payments, stock discrepancies, and error alerts every 30 minutes for the first day.
- Reconcile Paystack transactions, database orders, and physical stock at close of business.
- Keep a manual order log and a clear customer message ready if checkout must be paused.

## Immediate next action

Start Day 1 with the storefront recovery decision and the eight business inputs above. Engineering should begin the API route/security fixes in parallel with catalog preparation.

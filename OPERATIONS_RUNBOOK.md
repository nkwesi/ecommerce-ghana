# Drobe 233 launch operations runbook

Use this runbook during the soft launch and whenever payments, notifications, or checkout behave unexpectedly.

## Non-negotiable rule

Never fulfil an order from a customer screenshot or browser redirect. The order must show `paid` in the staff order view and the same reference, amount, and currency must be successful in Paystack.

## Start-of-day checks

1. Confirm the storefront and `GET /api/v1/health` return successfully over HTTPS.
2. Confirm the latest database backup completed and record its timestamp.
3. Sign in to the staff order view and confirm orders can be opened and updated.
4. Confirm the Paystack webhook is enabled and points to `/api/v1/webhooks/paystack` on the production API.
5. Confirm the notification provider is healthy, then send a test message to the internal order-alert address.
6. Compare the launch stock snapshot with physical stock before accepting orders.

## Pending payment

1. Wait at least three minutes for Mobile Money authorization and webhook delivery.
2. Refresh the order page; it requests server-side Paystack reconciliation without trusting the browser reference.
3. Check the transaction in Paystack using the payment reference.
4. If Paystack shows success but the order remains pending, pause fulfilment and escalate to the technical owner with the order number and reference.
5. Do not manually mark a pending order paid until the Paystack amount, currency, reference, and customer order have all been reconciled.

## Paystack or checkout outage

1. Pause new sales by displaying a checkout-unavailable message or disabling API checkout.
2. Keep existing pending orders pending; do not ask customers to pay a second time until their first reference is checked.
3. Record the outage start time and affected order numbers in the manual order log.
4. Check Paystack status, API logs, and uptime alerts.
5. Resume sales only after a test-mode initialization and the production health checks pass. A live low-value test is required after any live credential or webhook change.

## Notification outage

1. Payment confirmation remains authoritative even if email or alerts fail.
2. Export or copy all paid orders created since the last successful notification.
3. Contact each affected customer manually using the order contact details and provide the order number and current status.
4. Notify the fulfilment owner through the agreed backup channel.
5. Re-send notifications after recovery, clearly labelling delayed duplicates.

## Suspected duplicate or mismatched payment

1. Stop fulfilment for the affected order.
2. Compare Paystack reference, integer pesewa amount, currency, and order metadata with the database payment record.
3. Do not edit inventory manually while reconciliation is in progress.
4. If the customer paid twice, preserve both references and follow the approved refund procedure.
5. Record the resolution and confirm stock changed only once.

## End-of-day reconciliation

1. Match every Paystack success to exactly one paid order.
2. Match every paid order to one stock conversion and its fulfilment status.
3. Review pending and failed payments, webhook errors, notification failures, and stock discrepancies.
4. Export the manual order log and record the latest backup timestamp.
5. Escalate every unresolved mismatch before the next sales window.

## Incident record

For each incident record: start/end time, customer impact, order numbers, payment references, actions taken, owner, resolution, and follow-up work. Never place secret keys or full payment credentials in the incident record.

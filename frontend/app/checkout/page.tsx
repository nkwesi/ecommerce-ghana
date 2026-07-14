'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart-provider';
import { formatGHS } from '@/lib/catalog';
import { checkout, reserveItem } from '@/lib/api';
import { deliveryZones, getDeliveryZone, type DeliveryZoneId } from '@/lib/delivery-zones';

export default function CheckoutPage() {
  const { items, subtotal, clear, sessionId } = useCart();
  const router = useRouter();
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZoneId>('central_accra');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selectedZone = getDeliveryZone(deliveryZone);
  const deliveryFee = selectedZone.fee;
  const total = subtotal + deliveryFee;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const data = new FormData(event.currentTarget);

    try {
      if (process.env.NEXT_PUBLIC_CHECKOUT_MODE === 'api') {
        for (const item of items) {
          await reserveItem(item.variant.sku, item.quantity, sessionId);
        }

        const result = await checkout({
          sessionId,
          customer: {
            email: String(data.get('email')),
            name: String(data.get('fullName')),
            phone: String(data.get('phone')),
          },
          shipping: {
            fullName: String(data.get('fullName')),
            addressLine1: String(data.get('addressLine1')),
            city: String(data.get('city')),
            region: 'Greater Accra',
            deliveryZone,
            phone: String(data.get('phone')),
            deliveryInstructions: String(data.get('notes') || ''),
          },
        });
        localStorage.setItem('ghanastyle-last-email', String(data.get('email')));
        clear();
        window.location.assign(result.payment.checkoutUrl);
        return;
      }

      const orderNumber = `GH-DEMO-${Date.now().toString().slice(-6)}`;
      const order = {
        orderNumber,
        email: data.get('email'),
        name: data.get('fullName'),
        items,
        subtotal,
        deliveryZone,
        deliveryFee,
        total,
        status: 'Payment pending',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(`ghanastyle-order-${orderNumber}`, JSON.stringify(order));
      localStorage.setItem('ghanastyle-last-email', String(data.get('email')));
      clear();
      router.push(`/order/${orderNumber}?demo=1`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Checkout could not be completed. Please try again.');
      setBusy(false);
    }
  }

  if (!items.length) {
    return <div className="empty-state"><h1>Your bag is empty.</h1><Link className="button primary" href="/shop">Return to shop</Link></div>;
  }

  return <section className="checkout-page">
    <form onSubmit={submit} className="checkout-form">
      <Link href="/cart" className="back-link">← Back to bag</Link>
      <p className="eyebrow">Secure checkout</p>
      <h1>Delivery details</h1>

      <div className="form-section">
        <h2>Contact</h2>
        <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
        <label>Phone number<input name="phone" type="tel" autoComplete="tel" required placeholder="+233 20 000 0000" /></label>
      </div>

      <div className="form-section">
        <h2>Delivery address</h2>
        <label>Full name<input name="fullName" autoComplete="name" required /></label>
        <label>Address<input name="addressLine1" autoComplete="street-address" required placeholder="House number and street" /></label>
        <label>City / town<input name="city" required placeholder="Your Accra neighbourhood" /></label>
        <label>Delivery notes <span>Optional</span><textarea name="notes" rows={3} placeholder="Landmark, digital address, gate instructions, or preferred time" /></label>
      </div>

      <div className="form-section">
        <h2>Delivery zone</h2>
        {deliveryZones.map((zone) => <label key={zone.id} className={deliveryZone === zone.id ? 'radio-option selected' : 'radio-option'}>
          <input type="radio" name="deliveryZone" value={zone.id} checked={deliveryZone === zone.id} onChange={() => setDeliveryZone(zone.id)} />
          <span><b>{zone.name}</b><small>{zone.areas} · Same-day subject to rider availability</small></span>
          <strong>{formatGHS(zone.fee)}</strong>
        </label>)}
        <p className="fine-print">Delivery is fulfilled by a third-party courier. Select the zone containing your delivery address; we will contact you if the location needs clarification.</p>
      </div>

      <div className="payment-note"><b>Payment comes next</b><p>{process.env.NEXT_PUBLIC_CHECKOUT_MODE === 'api' ? 'You will continue to secure Paystack checkout for Mobile Money or card.' : 'This demo creates a test order without charging you.'}</p></div>
      {error && <p className="form-error">{error}</p>}
      <button disabled={busy} className="button primary full">{busy ? 'Preparing your order…' : `Continue to payment · ${formatGHS(total)}`}</button>
      <p className="fine-print">By continuing, you agree to our <Link href="/policies/terms">terms</Link> and <Link href="/policies/privacy">privacy policy</Link>.</p>
    </form>

    <aside className="checkout-summary">
      <h2>Your order</h2>
      {items.map((item) => <div className="checkout-line" key={item.variant.id}>
        <div><Image src={item.product.image} alt="" width={72} height={72}/><i>{item.quantity}</i></div>
        <span><b>{item.product.name}</b><small>{item.variant.color} · {item.variant.size}</small></span>
        <strong>{formatGHS(item.variant.price * item.quantity)}</strong>
      </div>)}
      <div className="checkout-totals">
        <p><span>Subtotal</span><b>{formatGHS(subtotal)}</b></p>
        <p><span>Delivery · {selectedZone.name}</span><b>{formatGHS(deliveryFee)}</b></p>
        <p><span>Total</span><b>{formatGHS(total)}</b></p>
      </div>
    </aside>
  </section>;
}

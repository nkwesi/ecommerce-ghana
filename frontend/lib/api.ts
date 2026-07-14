import type { DeliveryZoneId } from './delivery-zones';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export type CheckoutPayload = {
  sessionId: string;
  customer: { email: string; name: string; phone: string };
  shipping: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    region: string;
    deliveryZone: DeliveryZoneId;
    phone: string;
    deliveryInstructions?: string;
  };
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || body?.error?.message || 'Something went wrong');
  return body as T;
}

export function reserveItem(sku: string, quantity: number, sessionId: string) {
  return request<{ reservationId: string; expiresAt: string }>('/inventory/reserve', {
    method: 'POST', body: JSON.stringify({ sku, quantity, sessionId }),
  });
}

export function releaseReservation(id: string) {
  return request('/inventory/reserve/' + id + '/release', { method: 'POST' });
}

export function checkout(payload: CheckoutPayload) {
  return request<{ order: { orderNumber: string }; payment: { checkoutUrl: string } }>('/checkout', {
    method: 'POST', body: JSON.stringify(payload),
  });
}

export function getOrder(orderNumber: string, email: string) {
  return request<Record<string, unknown>>(`/orders/${encodeURIComponent(orderNumber)}?email=${encodeURIComponent(email)}`);
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import { formatGHS } from '@/lib/catalog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
type Order = { id: string; orderNumber: string; customerName: string; customerEmail: string; status: string; total: number; createdAt: string };

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('ghanastyle-admin-token');
    if (saved) { setToken(saved); loadOrders(saved); }
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${API_URL}/auth/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Login failed');
      sessionStorage.setItem('ghanastyle-admin-token', body.token); setToken(body.token); await loadOrders(body.token);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Login failed'); } finally { setLoading(false); }
  }

  async function loadOrders(authToken = token) {
    try {
      const response = await fetch(`${API_URL}/admin/orders`, { headers: { Authorization: `Bearer ${authToken}` } });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Could not load orders');
      setOrders(body.orders || []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load orders'); }
  }

  async function updateStatus(id: string, status: string) {
    const response = await fetch(`${API_URL}/admin/orders/${id}/status`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (response.ok) loadOrders(); else setError('Status update failed');
  }

  function signOut() { sessionStorage.removeItem('ghanastyle-admin-token'); setToken(''); setOrders([]); }

  if (!token) return <section className="admin-login"><p className="eyebrow">Staff only</p><h1>Store sign in</h1><form onSubmit={login}><label>Email<input name="email" type="email" required /></label><label>Password<input name="password" type="password" required /></label>{error && <p className="form-error">{error}</p>}<button className="button primary full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button></form></section>;

  return <section className="admin-page"><div className="admin-heading"><div><p className="eyebrow">Operations</p><h1>Orders</h1></div><div><button onClick={() => loadOrders()}>Refresh</button><button onClick={signOut}>Sign out</button></div></div>{error && <p className="form-error">{error}</p>}<div className="admin-table"><div className="admin-row head"><span>Order</span><span>Customer</span><span>Date</span><span>Total</span><span>Status</span></div>{orders.length ? orders.map((order) => <div className="admin-row" key={order.id}><b>{order.orderNumber}</b><span>{order.customerName}<small>{order.customerEmail}</small></span><span>{new Date(order.createdAt).toLocaleDateString('en-GH')}</span><span>{formatGHS(Number(order.total))}</span><select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}><option value="pending">Pending</option><option value="paid">Paid</option><option value="processing">Processing</option><option value="shipped">Dispatched</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></div>) : <p className="admin-empty">No orders to show yet.</p>}</div></section>;
}

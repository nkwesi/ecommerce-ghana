'use client';

import { FormEvent, useEffect, useState } from 'react';
import { formatGHS } from '@/lib/catalog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
  createdAt: string;
};

type ImportPreview = {
  fingerprint: string;
  valid: boolean;
  storageReady: boolean;
  rowCount: number;
  productCount: number;
  variantCount: number;
  imageCount: number;
  totalStock: number;
  warnings: string[];
  products: Array<{
    productCode: string;
    name: string;
    category: string;
    slug: string;
    basePrice: number;
    variantCount: number;
    totalStock: number;
    imageFileNames: string[];
  }>;
};

async function responseError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null) as { message?: string | { message?: string; errors?: string[] }; errors?: string[] } | null;
  const nested = typeof body?.message === 'object' ? body.message : null;
  return {
    message: (typeof body?.message === 'string' ? body.message : nested?.message) || fallback,
    errors: body?.errors || nested?.errors || [],
  };
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [section, setSection] = useState<'orders' | 'products'>('orders');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [workbookFile, setWorkbookFile] = useState<File | null>(null);
  const [imagesFile, setImagesFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [published, setPublished] = useState<{ productsCreated: number; variantsCreated: number; imagesUploaded: number } | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('ghanastyle-admin-token');
    if (saved) { setToken(saved); void loadOrders(saved); }
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${API_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.get('email'), password: data.get('password') }),
      });
      if (!response.ok) throw new Error((await responseError(response, 'Login failed')).message);
      const body = await response.json();
      sessionStorage.setItem('ghanastyle-admin-token', body.token);
      setToken(body.token);
      await loadOrders(body.token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Login failed');
    } finally { setLoading(false); }
  }

  async function loadOrders(authToken = token) {
    try {
      const response = await fetch(`${API_URL}/admin/orders`, { headers: { Authorization: `Bearer ${authToken}` } });
      if (!response.ok) throw new Error((await responseError(response, 'Could not load orders')).message);
      const body = await response.json();
      setOrders(body.orders || []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load orders'); }
  }

  async function updateStatus(id: string, status: string) {
    const response = await fetch(`${API_URL}/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (response.ok) void loadOrders(); else setError('Status update failed');
  }

  async function downloadTemplate() {
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API_URL}/admin/products/bulk/template`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error((await responseError(response, 'Could not download the template')).message);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'drobe-233-product-upload-template.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not download the template'); }
    finally { setLoading(false); }
  }

  function chooseWorkbook(file: File | null) {
    setWorkbookFile(file); setPreview(null); setPublished(null); setValidationErrors([]); setError('');
  }

  function chooseImages(file: File | null) {
    setImagesFile(file); setPreview(null); setPublished(null); setValidationErrors([]); setError('');
  }

  function uploadData(includeFingerprint = false) {
    const data = new FormData();
    if (workbookFile) data.append('workbook', workbookFile);
    if (imagesFile) data.append('images', imagesFile);
    if (includeFingerprint && preview) data.append('fingerprint', preview.fingerprint);
    return data;
  }

  async function previewUpload() {
    if (!workbookFile || !imagesFile) { setError('Choose both the completed Excel template and the image ZIP.'); return; }
    setLoading(true); setError(''); setValidationErrors([]); setPreview(null); setPublished(null);
    try {
      const response = await fetch(`${API_URL}/admin/products/bulk/preview`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: uploadData(),
      });
      if (!response.ok) {
        const problem = await responseError(response, 'The upload could not be validated');
        setValidationErrors(problem.errors);
        throw new Error(problem.message);
      }
      setPreview(await response.json());
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The upload could not be validated'); }
    finally { setLoading(false); }
  }

  async function publishUpload() {
    if (!preview) return;
    setLoading(true); setError(''); setValidationErrors([]);
    try {
      const response = await fetch(`${API_URL}/admin/products/bulk/publish`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: uploadData(true),
      });
      if (!response.ok) {
        const problem = await responseError(response, 'Products could not be published');
        setValidationErrors(problem.errors);
        throw new Error(problem.message);
      }
      setPublished(await response.json());
      setPreview(null); setWorkbookFile(null); setImagesFile(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Products could not be published'); }
    finally { setLoading(false); }
  }

  function signOut() {
    sessionStorage.removeItem('ghanastyle-admin-token');
    setToken(''); setOrders([]); setPreview(null); setPublished(null);
  }

  if (!token) return (
    <section className="admin-login">
      <p className="eyebrow">Staff only</p><h1>Store sign in</h1>
      <form onSubmit={login}>
        <label>Email<input name="email" type="email" required /></label>
        <label>Password<input name="password" type="password" required /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="button primary full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </section>
  );

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <div><p className="eyebrow">Operations</p><h1>{section === 'orders' ? 'Orders' : 'Bulk products'}</h1></div>
        <div><button onClick={signOut}>Sign out</button></div>
      </div>

      <nav className="admin-tabs" aria-label="Admin sections">
        <button className={section === 'orders' ? 'active' : ''} onClick={() => setSection('orders')}>Orders <span>{orders.length}</span></button>
        <button className={section === 'products' ? 'active' : ''} onClick={() => setSection('products')}>Bulk product upload</button>
      </nav>

      {error && <p className="form-error">{error}</p>}
      {validationErrors.length > 0 && <div className="validation-errors"><b>Fix these items and preview again</b><ol>{validationErrors.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ol></div>}

      {section === 'orders' ? (
        <>
          <div className="admin-section-actions"><p>Review and update fulfilment status.</p><button onClick={() => loadOrders()}>Refresh orders</button></div>
          <div className="admin-table">
            <div className="admin-row head"><span>Order</span><span>Customer</span><span>Date</span><span>Total</span><span>Status</span></div>
            {orders.length ? orders.map((order) => (
              <div className="admin-row" key={order.id}>
                <b>{order.orderNumber}</b><span>{order.customerName}<small>{order.customerEmail}</small></span>
                <span>{new Date(order.createdAt).toLocaleDateString('en-GH')}</span><span>{formatGHS(Number(order.total))}</span>
                <select value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)}>
                  <option value="pending">Pending</option><option value="paid">Paid</option><option value="processing">Processing</option>
                  <option value="shipped">Dispatched</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option>
                </select>
              </div>
            )) : <p className="admin-empty">No orders to show yet.</p>}
          </div>
        </>
      ) : (
        <div className="bulk-upload">
          <section className="bulk-intro">
            <div><span className="step-number">01</span><h2>Start with the template</h2><p>One row represents one size and colour variant at one fulfilment store. Fill the empty Products sheet; the workbook includes a separate Example sheet, dropdowns, and instructions.</p></div>
            <button className="button outline" onClick={downloadTemplate} disabled={loading}>Download Excel template</button>
          </section>

          <section className="bulk-guide">
            <div><b>Image naming</b><p>Use the product code followed by a two-digit image number.</p><code>AMA-MIDI-01.jpg</code></div>
            <div><b>Multiple images</b><p>List names in Excel with a vertical bar and place every file at the ZIP root.</p><code>AMA-MIDI-01.jpg|AMA-MIDI-02.jpg</code></div>
            <div><b>Safe publishing</b><p>Nothing is created until validation passes and you confirm the preview.</p></div>
          </section>

          <section className="upload-panel">
            <div className="upload-panel-heading"><span className="step-number">02</span><div><h2>Choose both files</h2><p>Maximum 10 MB for Excel and 100 MB for the image ZIP.</p></div></div>
            <div className="file-pickers">
              <label className={workbookFile ? 'file-picker selected' : 'file-picker'}>
                <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => chooseWorkbook(event.target.files?.[0] ?? null)} />
                <span>Excel workbook</span><b>{workbookFile?.name || 'Choose completed template'}</b><small>{workbookFile ? `${(workbookFile.size / 1024).toFixed(0)} KB` : '.xlsx only'}</small>
              </label>
              <label className={imagesFile ? 'file-picker selected' : 'file-picker'}>
                <input type="file" accept=".zip,application/zip" onChange={(event) => chooseImages(event.target.files?.[0] ?? null)} />
                <span>Product images</span><b>{imagesFile?.name || 'Choose image ZIP'}</b><small>{imagesFile ? `${(imagesFile.size / 1024 / 1024).toFixed(1)} MB` : 'JPG, PNG, or WEBP inside'}</small>
              </label>
            </div>
            <button className="button primary" onClick={previewUpload} disabled={loading || !workbookFile || !imagesFile}>{loading ? 'Validating files…' : 'Validate and preview'}</button>
          </section>

          {published && <section className="publish-success"><div className="success-mark">✓</div><div><h2>Products published</h2><p>{published.productsCreated} products, {published.variantsCreated} variants, and {published.imagesUploaded} images were added successfully.</p></div></section>}

          {preview && (
            <section className="import-preview">
              <div className="upload-panel-heading"><span className="step-number">03</span><div><h2>Review before publishing</h2><p>All rows and referenced images passed validation.</p></div></div>
              <div className="preview-stats">
                <div><b>{preview.productCount}</b><span>Products</span></div><div><b>{preview.variantCount}</b><span>Variants</span></div>
                <div><b>{preview.totalStock}</b><span>Total units</span></div><div><b>{preview.imageCount}</b><span>Images</span></div>
              </div>
              {preview.warnings.length > 0 && <div className="import-warnings">{preview.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>}
              <div className="preview-products">
                <div className="preview-product head"><span>Product</span><span>Category</span><span>Price</span><span>Variants</span><span>Stock</span><span>Images</span></div>
                {preview.products.map((product) => <div className="preview-product" key={product.productCode}>
                  <span><b>{product.name}</b><small>{product.productCode}</small></span><span>{product.category}</span>
                  <span>{formatGHS(product.basePrice)}</span><span>{product.variantCount}</span><span>{product.totalStock}</span><span>{product.imageFileNames.length}</span>
                </div>)}
              </div>
              <div className="publish-bar"><div><b>Ready to publish?</b><p>This creates new catalog records and stock. Existing products are never overwritten.</p></div><button className="button primary" onClick={publishUpload} disabled={loading || !preview.storageReady}>{loading ? 'Publishing…' : 'Publish products'}</button></div>
            </section>
          )}
        </div>
      )}
    </section>
  );
}

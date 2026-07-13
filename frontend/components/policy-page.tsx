import Link from 'next/link';
export function PolicyPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) { return <section className="policy-page"><Link href="/">← Home</Link><p className="eyebrow">Customer care</p><h1>{title}</h1><span className="policy-updated">{updated}</span><div className="policy-body">{children}</div></section>; }

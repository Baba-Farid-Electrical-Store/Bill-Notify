import Link from 'next/link';
import { and, desc, eq, gte, ilike, lt, lte, or } from 'drizzle-orm';
import { InvoiceActions } from '@/components/invoice-actions';
import { db } from '@/lib/db';
import { invoices, messages } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
type Params = { q?: string; status?: string; cursor?: string; from?: string; to?: string };

export default async function InvoicesPage({ searchParams }: { searchParams: Params }) {
  const database = db();
  const filters = [];
  const query = searchParams.q?.trim();
  if (query) filters.push(or(ilike(invoices.number, `%${query}%`), ilike(invoices.partnerName, `%${query}%`), ilike(invoices.partnerPhone, `%${query}%`))!);
  if (searchParams.from && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.from)) filters.push(gte(invoices.invoiceDate, searchParams.from));
  if (searchParams.to && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.to)) filters.push(lte(invoices.invoiceDate, searchParams.to));
  const cursor = Number(searchParams.cursor);
  if (Number.isInteger(cursor) && cursor > 0) filters.push(lt(invoices.id, cursor));
  const matching = await database.select().from(invoices).where(and(...filters)).orderBy(desc(invoices.id)).limit(51);
  const hasNext = matching.length > 50;
  let rows = matching.slice(0, 50);
  const messageRows = await database.select({ invoiceId: messages.invoiceId, status: messages.status }).from(messages).orderBy(desc(messages.createdAt));
  const statusById = new Map<number, string>();
  for (const message of messageRows) if (message.invoiceId && !statusById.has(message.invoiceId)) statusById.set(message.invoiceId, message.status);
  if (searchParams.status) rows = rows.filter((invoice) => (statusById.get(invoice.id) || 'not_sent') === searchParams.status);
  const nextParams = new URLSearchParams();
  if (query) nextParams.set('q', query);
  if (searchParams.status) nextParams.set('status', searchParams.status);
  if (searchParams.from) nextParams.set('from', searchParams.from);
  if (searchParams.to) nextParams.set('to', searchParams.to);
  if (hasNext && matching[49]) nextParams.set('cursor', String(matching[49].id));
  const nextHref = `/invoices?${nextParams.toString()}`;

  return <>
    <div className="page-heading"><h1>Invoices</h1><p>Posted customer invoices synced from Odoo</p></div>
    <form className="card invoice-filters" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
      <input className="field" style={{ flex: '1 1 220px', margin: 0 }} name="q" defaultValue={query} placeholder="Search invoice, customer, phone" aria-label="Search invoices" />
      <select className="field" style={{ width: 160, margin: 0 }} name="status" defaultValue={searchParams.status || ''} aria-label="Filter by SMS status">
        <option value="">All statuses</option>{['sent', 'failed', 'skipped', 'not_sent'].map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
      </select>
      <input className="field" style={{ width: 160, margin: 0 }} type="date" name="from" defaultValue={searchParams.from} aria-label="From date" />
      <input className="field" style={{ width: 160, margin: 0 }} type="date" name="to" defaultValue={searchParams.to} aria-label="To date" />
      <button className="button">Filter</button>
    </form>
    {rows.length === 0 ? <div className="card muted">No invoices found. Run a sync to import invoices.</div> : <>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Invoice</th><th>Customer / phone</th><th>Amount</th><th>Date</th><th>SMS status</th><th>Actions</th></tr></thead><tbody>
        {rows.map((invoice) => <tr key={invoice.id}><td>{invoice.number}</td><td>{invoice.partnerName}<br /><span className="muted">{invoice.phoneOverride || invoice.partnerPhone || 'No phone'}</span></td><td>{Number(invoice.amountTotal || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td><td>{invoice.invoiceDate || '—'}</td><td><span className={`badge ${statusById.get(invoice.id) || 'not_sent'}`}>{statusById.get(invoice.id) || 'not sent'}</span></td><td><InvoiceActions id={invoice.id} phone={invoice.phoneOverride || invoice.partnerPhone} />{invoice.invoiceUrl && <a href={invoice.invoiceUrl} target="_blank" rel="noreferrer">Open invoice</a>}</td></tr>)}
      </tbody></table></div>
      <div className="stack" style={{ marginTop: 12 }}>{rows.map((invoice) => <article className="card mobile-card" key={`m${invoice.id}`}><div className="row"><strong>{invoice.number}</strong><span className={`badge ${statusById.get(invoice.id) || 'not_sent'}`}>{statusById.get(invoice.id) || 'not sent'}</span></div><p>{invoice.partnerName} · {invoice.phoneOverride || invoice.partnerPhone || 'No phone'}</p><p className="muted">{Number(invoice.amountTotal || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} · {invoice.invoiceDate || '—'}</p><InvoiceActions id={invoice.id} phone={invoice.phoneOverride || invoice.partnerPhone} />{invoice.invoiceUrl && <a href={invoice.invoiceUrl} target="_blank" rel="noreferrer">Open invoice</a>}</article>)}</div>
      {hasNext && <div style={{ marginTop: 16 }}><Link className="button secondary" href={nextHref}>Next 50 invoices</Link></div>}
    </>}
  </>;
}

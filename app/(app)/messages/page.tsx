import { db } from '@/lib/db';
import { messages, invoices } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { RetryMessage } from '@/components/invoice-actions';

export const dynamic = 'force-dynamic';

export default async function Messages() {
  const rows = await db().select({ message: messages, invoice: invoices })
    .from(messages).leftJoin(invoices, eq(messages.invoiceId, invoices.id))
    .orderBy(desc(messages.createdAt)).limit(200);

  return <>
    <div className="page-heading"><h1>Messages</h1><p>SMS history and delivery results</p></div>
    <div className="section message-list">
      {rows.length ? rows.map(({ message: m, invoice }) => <article className="card message-card" key={m.id}>
        <div className="message-card-heading"><div><span className="message-label">INVOICE</span><strong>{invoice?.number || 'No invoice'}</strong></div><span className={`badge ${m.status}`}>{m.status}</span></div>
        <div className="message-meta"><span>{m.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span><span>To {m.toNumber}</span></div>
        {m.error && <p className="message-error">{m.error}</p>}
        <details><summary>View message content</summary><pre className="message-content">{m.content || 'No message content recorded'}</pre></details>
        {m.httpsmsId && <p className="muted">httpSMS ID: {m.httpsmsId}</p>}
        {m.status === 'failed' && <RetryMessage id={m.id} />}
      </article>) : <div className="card empty-state"><div className="empty-state-icon">SMS</div><h2>No messages yet</h2><p className="muted">Sync invoices to start a delivery history.</p></div>}
    </div>
  </>;
}

import { and, desc, eq, gte, or } from 'drizzle-orm';
import { ActivityChart } from '@/components/chart';
import { InvoiceActions } from '@/components/invoice-actions';
import { SyncButton } from '@/components/sync-button';
import { db } from '@/lib/db';
import { invoices, messages, syncRuns } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const database = db();
  const now = new Date();
  const today = istStart(now);
  const week = new Date(today.getTime() - 6 * 86_400_000);
  const [recent, todayMessages, weekMessages, attention, runs] = await Promise.all([
    database.select().from(messages).orderBy(desc(messages.createdAt)).limit(250),
    database.select().from(messages).where(gte(messages.createdAt, today)),
    database.select().from(messages).where(gte(messages.createdAt, week)),
    database.select({ message: messages, invoice: invoices })
      .from(messages).leftJoin(invoices, eq(messages.invoiceId, invoices.id))
      .where(or(eq(messages.status, 'failed'), and(eq(messages.status, 'skipped'), eq(messages.error, 'no_valid_phone'))))
      .orderBy(desc(messages.createdAt)).limit(10),
    database.select().from(syncRuns).orderBy(desc(syncRuns.startedAt)).limit(1),
  ]);

  const sentToday = todayMessages.filter((message) => message.status === 'sent' || message.status === 'delivered').length;
  const sentWeek = weekMessages.filter((message) => message.status === 'sent' || message.status === 'delivered').length;
  const failed = recent.filter((message) => message.status === 'failed').length;
  const skippedNoPhone = recent.filter((message) => message.status === 'skipped' && message.error === 'no_valid_phone').length;
  const chart = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today.getTime() - (13 - index) * 86_400_000);
    const day = istKey(date);
    const dayMessages = recent.filter((message) => istKey(message.createdAt) === day);
    return {
      day: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }),
      sent: dayMessages.filter((message) => message.status === 'sent' || message.status === 'delivered').length,
      failed: dayMessages.filter((message) => message.status === 'failed').length,
    };
  });

  return <>
    <div className="topbar"><div><h1>Dashboard</h1><p className="muted">Invoice updates at a glance</p></div><SyncButton /></div>
    <div className="grid">
      <Metric label="SMS sent today" value={sentToday} />
      <Metric label="SMS sent · 7 days" value={sentWeek} />
      <Metric label="Failed · needs attention" value={failed} />
      <Metric label="Skipped · no phone" value={skippedNoPhone} />
    </div>
    <section className="section card"><h2>SMS activity · 14 days</h2><ActivityChart data={chart} /></section>
    <section className="section card"><h2>Needs attention</h2>
      {attention.length === 0 ? <p className="muted">No failed messages or invoices missing a valid phone.</p> : attention.map(({ message, invoice }) => <div className="row" key={message.id}>
        <div><strong>{invoice?.number || 'Invoice'}</strong><div className="muted">{invoice?.partnerName} · {message.error}</div></div>
        {invoice && <InvoiceActions id={invoice.id} phone={invoice.phoneOverride || invoice.partnerPhone} />}
      </div>)}
    </section>
    <section className="section card"><h2>Last sync</h2>{runs[0] ? <p className="muted">{runs[0].finishedAt?.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) || 'Running'} · checked {runs[0].checked}, sent {runs[0].sent}, failed {runs[0].failed}</p> : <p className="muted">No sync has run yet.</p>}</section>
  </>;
}

function istKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
function istStart(date: Date) { return new Date(`${istKey(date)}T00:00:00+05:30`); }
function Metric({ label, value }: { label: string; value: number }) { return <div className="card"><div className="metric-label">{label}</div><div className="metric-value">{value}</div></div>; }

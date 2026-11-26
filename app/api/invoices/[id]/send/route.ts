import { and, count, eq, gte, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { required } from '@/lib/env';
import { sendSms } from '@/lib/httpsms';
import { db } from '@/lib/db';
import { invoices, messages, settings, templates } from '@/lib/db/schema';
import { toE164 } from '@/lib/phone';
import { DEFAULT_BODY, render } from '@/lib/templates';

const bodySchema = z.object({ phone: z.string().optional(), resend: z.boolean().default(false), confirm: z.literal(true) });
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const input = bodySchema.parse(await request.json());
    const database = db();
    const recentManualSends = await database.select({ value: count() }).from(messages).where(and(
      gte(messages.createdAt, new Date(Date.now() - 60_000)),
      inArray(messages.trigger, ['manual', 'resend']),
    ));
    if (Number(recentManualSends[0]?.value || 0) >= 10) return Response.json({ error: 'Too many manual sends. Try again in a minute.' }, { status: 429 });

    const id = z.coerce.number().int().positive().parse(params.id);
    const [invoice] = await database.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 });
    const [config] = await database.select().from(settings).where(eq(settings.id, 1)).limit(1);
    const to = toE164(input.phone || invoice.phoneOverride || invoice.partnerPhone, config?.countryCode || '+91');
    if (!to) return Response.json({ error: 'Enter a valid phone number' }, { status: 400 });
    const [template] = await database.select().from(templates).where(eq(templates.isDefault, true)).limit(1);
    const content = render(template?.body || DEFAULT_BODY, {
      customer: (invoice.partnerName || 'Customer').toUpperCase(),
      invoice_no: invoice.number,
      amount: Number(invoice.amountTotal || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
      date: invoice.invoiceDate || '', link: invoice.invoiceUrl,
      store: config?.storeName || 'Baba Farid Electrical Store',
    });
    if (input.phone) await database.update(invoices).set({ phoneOverride: input.phone }).where(eq(invoices.id, id));
    const [message] = await database.insert(messages).values({
      invoiceId: id, templateId: template?.id || null, toNumber: to, content, status: 'queued', trigger: input.resend ? 'resend' : 'manual',
    }).returning();

    if (config?.dryRun) {
      await database.update(messages).set({ status: 'skipped', error: 'dry run — not sent', updatedAt: new Date() }).where(eq(messages.id, message.id));
      return Response.json({ status: 'dry_run' });
    }
    try {
      const response = await sendSms({ apiKey: required('HTTPSMS_API_KEY'), from: required('HTTPSMS_FROM_NUMBER'), to, content });
      await database.update(messages).set({ status: 'sent', httpsmsId: response.id || response.message_id || null, updatedAt: new Date() }).where(eq(messages.id, message.id));
      return Response.json({ status: 'sent' });
    } catch (error) {
      await database.update(messages).set({ status: 'failed', error: String(error), updatedAt: new Date() }).where(eq(messages.id, message.id));
      throw error;
    }
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Send failed' }, { status: 400 });
  }
}

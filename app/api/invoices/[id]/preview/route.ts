import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoices, settings, templates } from '@/lib/db/schema';
import { DEFAULT_BODY, render } from '@/lib/templates';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const id = z.coerce.number().int().positive().parse(params.id);
    const database = db();
    const [invoice] = await database.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 });
    const [config] = await database.select().from(settings).where(eq(settings.id, 1)).limit(1);
    const [template] = await database.select().from(templates).where(eq(templates.isDefault, true)).limit(1);
    const content = render(template?.body || DEFAULT_BODY, {
      customer: (invoice.partnerName || 'Customer').toUpperCase(),
      invoice_no: invoice.number,
      amount: Number(invoice.amountTotal || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
      date: invoice.invoiceDate || '',
      link: invoice.invoiceUrl,
      store: config?.storeName || 'Baba Farid Electrical Store',
    });
    return Response.json({ content });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Preview failed' }, { status: 400 });
  }
}

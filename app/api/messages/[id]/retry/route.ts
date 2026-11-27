import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { safeApiErrorMessage, safeApiErrorStatus } from '@/lib/api-errors';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoices, messages } from '@/lib/db/schema';

export async function POST(request: Request, { params }: { params: { id: string; }; }) {
  try {
    await requireUser();
    const id = z.coerce.number().int().positive().parse(params.id);
    const [message] = await db().select().from(messages).where(eq(messages.id, id)).limit(1);

    if (!message || message.status !== 'failed' || !message.invoiceId) {
      return Response.json({ error: 'Failed message not found' }, { status: 404 });
    }

    const [invoice] = await db()
      .select()
      .from(invoices)
      .where(eq(invoices.id, message.invoiceId))
      .limit(1);
    if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 });

    const response = await fetch(new URL(`/api/invoices/${invoice.id}/send`, request.url), {
      method: 'POST',
      headers: {
        cookie: request.headers.get('cookie') || '',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ confirm: true, resend: true }),
    });

    return Response.json(await response.json(), { status: response.status });
  } catch (error) {
    return Response.json(
      { error: safeApiErrorMessage(error, 'Could not retry the message.') },
      { status: safeApiErrorStatus(error, 500) },
    );
  }
}

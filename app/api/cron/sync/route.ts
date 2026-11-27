import { safeApiErrorMessage, safeApiErrorStatus } from '@/lib/api-errors';
import { env } from '@/lib/env';
import { syncInvoices } from '@/lib/sync';

export const maxDuration = 60;

export async function GET(request: Request) {
  if (!env.CRON_SECRET) {
    return Response.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }

  if (request.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return Response.json(await syncInvoices({ trigger: 'cron' }));
  } catch (error) {
    return Response.json(
      { error: safeApiErrorMessage(error, 'Scheduled invoice sync failed.') },
      { status: safeApiErrorStatus(error, 500) },
    );
  }
}

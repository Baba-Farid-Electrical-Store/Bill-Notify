import { safeApiErrorMessage, safeApiErrorStatus } from '@/lib/api-errors';
import { requireUser } from '@/lib/auth';
import { syncInvoices } from '@/lib/sync';

export const maxDuration = 60;

export async function POST() {
  try {
    await requireUser();
    return Response.json(await syncInvoices({ trigger: 'manual' }));
  } catch (error) {
    return Response.json(
      { error: safeApiErrorMessage(error, 'Invoice sync failed.') },
      { status: safeApiErrorStatus(error, 500) },
    );
  }
}

import { safeApiErrorMessage, safeApiErrorStatus } from '@/lib/api-errors';
import { requireUser } from '@/lib/auth';
import { required } from '@/lib/env';
import { authenticate } from '@/lib/odoo';

export async function POST() {
  try {
    await requireUser();
    const uid = await authenticate({
      url: required('ODOO_URL').replace(/\/+$/, ''),
      db: required('ODOO_DB'),
      username: required('ODOO_USERNAME'),
      apiKey: required('ODOO_API_KEY'),
    });

    return Response.json({
      ok: !!uid,
      message: uid ? 'Odoo connection successful' : 'Odoo authentication failed',
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: safeApiErrorMessage(error, 'Could not connect to Odoo. Check the URL and credentials.'),
      },
      { status: safeApiErrorStatus(error, 400) },
    );
  }
}

import { safeApiErrorMessage, safeApiErrorStatus } from '@/lib/api-errors';
import { requireUser } from '@/lib/auth';
import { required } from '@/lib/env';

export async function POST() {
  try {
    await requireUser();
    const response = await fetch('https://api.httpsms.com/v1/messages', {
      headers: { 'x-api-key': required('HTTPSMS_API_KEY') },
      signal: AbortSignal.timeout(10_000),
    });

    return Response.json({
      ok: response.ok,
      message: response.ok
        ? 'httpSMS connection successful'
        : `httpSMS returned ${response.status}`,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: safeApiErrorMessage(
          error,
          'Could not connect to httpSMS. Check the API key and network.',
        ),
      },
      { status: safeApiErrorStatus(error, 400) },
    );
  }
}

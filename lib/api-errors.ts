/** Return useful input/auth errors without sending provider or database details to clients. */
export function safeApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;

  if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
    return error.message;
  }

  if (/^Missing required environment variable: [A-Z0-9_]+$/.test(error.message)) {
    return error.message;
  }

  if (error.name === 'ZodError') return error.message;

  return fallback;
}

export function safeApiErrorStatus(error: unknown, fallback: number): number {
  if (!(error instanceof Error)) return fallback;
  if (error.message === 'Unauthorized') return 401;
  if (error.message === 'Forbidden') return 403;
  if (error.name === 'ZodError') return 400;
  return fallback;
}

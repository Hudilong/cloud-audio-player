export type ApiError = {
  message: string;
  code?: string;
  status: number;
  retryAfter?: number;
  raw?: unknown;
};

export async function parseApiError(
  response?: Response,
  parsedBody?: unknown,
): Promise<ApiError> {
  if (!response) {
    return {
      message: 'Request failed. Please try again.',
      status: 500,
    };
  }

  let body: any = parsedBody ?? null;
  if (body === null) {
    try {
      body = await response.clone().json();
    } catch {
      // ignore JSON parse errors; fall back to status text
    }
  }

  const message =
    body?.error ||
    body?.message ||
    response.statusText ||
    'Request failed. Please try again.';

  const retryAfterHeader =
    typeof response.headers?.get === 'function'
      ? response.headers.get('Retry-After')
      : undefined;
  const retryAfter = retryAfterHeader
    ? Number.parseInt(retryAfterHeader, 10) || undefined
    : undefined;

  return {
    message,
    code: body?.code,
    status: response.status,
    retryAfter,
    raw: body,
  };
}

export function getFriendlyMessage(error: ApiError | Error): string {
  if ('status' in error) {
    const { code, status, message, retryAfter } = error as ApiError;

    if (status === 401) return 'Please sign in to continue.';
    if (status === 403) return 'You do not have access to this resource.';

    if (code === 'DAILY_UPLOAD_LIMIT') {
      return 'Daily upload limit reached. Try again tomorrow.';
    }
    if (code === 'TOTAL_UPLOAD_LIMIT') {
      return 'Total upload limit reached for this account.';
    }
    if (code === 'UPLOAD_RATE_LIMIT') {
      return retryAfter
        ? `Too many uploads. Try again in about ${retryAfter} seconds.`
        : 'Too many uploads. Please try again shortly.';
    }
    if (code === 'COVER_RATE_LIMIT') {
      return 'Too many cover uploads. Please try again shortly.';
    }
    if (code === 'UPLOAD_SIZE_EXCEEDED') {
      return message || 'Upload is too large.';
    }
    if (code === 'UPLOAD_TYPE_INVALID') {
      return message || 'Invalid file type.';
    }
    if (code === 'COVER_SIZE_EXCEEDED') {
      return message || 'Cover image is too large.';
    }
    if (code === 'INTERNAL_ERROR') {
      return 'Something went wrong. Please try again.';
    }

    // generic API error
    return message;
  }

  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

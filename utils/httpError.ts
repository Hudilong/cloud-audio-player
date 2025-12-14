import { NextResponse } from 'next/server';

export class HttpError extends Error {
  status: number;

  details?: unknown;

  code?: string;

  constructor(
    status: number,
    message: string,
    details?: unknown,
    code?: string,
  ) {
    super(message);
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export const badRequest = (
  message: string,
  details?: unknown,
  code = 'BAD_REQUEST',
) => new HttpError(400, message, details, code);
export const unauthorized = (message = 'Unauthorized', code = 'UNAUTHORIZED') =>
  new HttpError(401, message, undefined, code);
export const forbidden = (message = 'Forbidden', code = 'FORBIDDEN') =>
  new HttpError(403, message, undefined, code);
export const notFound = (message = 'Not found', code = 'NOT_FOUND') =>
  new HttpError(404, message, undefined, code);

export function toNextError(
  error: unknown,
  fallbackMessage = 'Internal Server Error',
  fallbackCode = 'INTERNAL_ERROR',
) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: error.status },
    );
  }

  // eslint-disable-next-line no-console -- surface unexpected server errors for debugging/observability
  console.error('Unhandled server error', error);
  return NextResponse.json(
    { error: fallbackMessage, code: fallbackCode },
    { status: 500 },
  );
}

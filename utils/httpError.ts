import { NextResponse } from 'next/server';

export class HttpError extends Error {
  status: number;

  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, message, details);
export const unauthorized = (message = 'Unauthorized') =>
  new HttpError(401, message);
export const forbidden = (message = 'Forbidden') => new HttpError(403, message);
export const notFound = (message = 'Not found') => new HttpError(404, message);

export function toNextError(
  error: unknown,
  fallbackMessage = 'Internal Server Error',
) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.status },
    );
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

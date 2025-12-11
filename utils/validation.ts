import { ZodError, ZodSchema } from 'zod';
import { NextResponse } from 'next/server';

type ParsedBody<T> =
  | { success: true; data: T }
  | { success: false; error: NextResponse };

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<ParsedBody<T>> {
  try {
    const json = await request.json();
    const parsed = schema.parse(json);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Invalid request body', details: error.issues },
          { status: 400 },
        ),
      };
    }
    return {
      success: false,
      error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    };
  }
}

import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { parseJsonBody } from '../../utils/validation';

describe('parseJsonBody', () => {
  it('parses valid JSON and schema', async () => {
    const req = new Request('http://localhost/test', {
      method: 'POST',
      body: JSON.stringify({ name: 'demo', count: 2 }),
    });

    const schema = z.object({
      name: z.string(),
      count: z.number(),
    });

    const result = await parseJsonBody(req, schema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: 'demo', count: 2 });
    }
  });

  it('returns 400 on invalid body', async () => {
    const req = new Request('http://localhost/test', {
      method: 'POST',
      body: JSON.stringify({ name: 123 }),
    });

    const schema = z.object({
      name: z.string(),
    });

    const result = await parseJsonBody(req, schema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.status).toBe(400);
    }
  });
});

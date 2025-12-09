import { POST } from '@/api/auth/register/route';
import { describe, expect, it, beforeEach, vi } from 'vitest';

const { mockUserCreate, mockHash } = vi.hoisted(() => ({
  mockUserCreate: vi.fn(),
  mockHash: vi.fn(),
}));

vi.mock('@utils/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      create: mockUserCreate,
    },
  },
}));

vi.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    hash: mockHash,
  },
}));

const buildRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if email or password is missing', async () => {
    const response = await POST(
      buildRequest({ email: 'test@example.com' /* Missing password */ }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      error: 'Email and password are required',
    });
  });

  it('should return 400 if email is invalid', async () => {
    const response = await POST(
      buildRequest({ email: 'invalid-email', password: 'password123' }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      error: 'Invalid email address',
    });
  });

  it('should hash the password and create a user successfully', async () => {
    const mockHashedPassword = 'hashedpassword123';
    mockHash.mockResolvedValue(mockHashedPassword);

    mockUserCreate.mockResolvedValue({ id: 'test-id' });

    const userPayload = {
      email: 'valid@example.com',
      password: 'password123',
      name: 'Test User',
    };

    const response = await POST(buildRequest(userPayload));

    expect(mockHash).toHaveBeenCalledWith(userPayload.password, 10);
    expect(mockUserCreate).toHaveBeenCalledWith({
      data: {
        email: userPayload.email,
        name: userPayload.name,
        password: mockHashedPassword,
      },
    });
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({
      message: 'User registered successfully',
    });
  });
});

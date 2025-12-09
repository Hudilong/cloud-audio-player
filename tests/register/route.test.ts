import request from 'supertest';
import { createServer } from 'http';
import app from '@/app'; // Adjust if you're using a custom server setup
import prisma from '@/../utils/prisma';
import bcrypt from 'bcrypt';
import {
  describe,
  expect,
  it,
  beforeAll,
  beforeEach,
  vi,
  afterAll,
} from 'vitest';

vi.mock('@/../utils/prisma', () => ({
  user: {
    create: vi.fn(),
  },
}));

describe('POST /api/register', () => {
  let server: ReturnType<typeof createServer>;

  beforeAll(() => {
    server = createServer(app.handler); // Use `next.js` API handler or custom handler
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if email or password is missing', async () => {
    const response = await request(server)
      .post('/api/register')
      .send({ email: 'test@example.com' }); // Missing password

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Email and password are required',
    });
  });

  it('should return 400 if email is invalid', async () => {
    const response = await request(server)
      .post('/api/register')
      .send({ email: 'invalid-email', password: 'password123' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Invalid email address',
    });
  });

  it('should hash the password and create a user successfully', async () => {
    const mockHashedPassword = 'hashedpassword123';
    const bcryptHashSpy = vi
      .spyOn(bcrypt, 'hash')
      .mockResolvedValue(mockHashedPassword);

    const userPayload = {
      email: 'valid@example.com',
      password: 'password123',
      name: 'Test User',
    };

    const response = await request(server)
      .post('/api/register')
      .send(userPayload);

    expect(bcryptHashSpy).toHaveBeenCalledWith(userPayload.password, 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: userPayload.email,
        name: userPayload.name,
        password: mockHashedPassword,
      },
    });
    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: 'User registered successfully',
    });
  });
});

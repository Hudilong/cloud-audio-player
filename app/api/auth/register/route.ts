import { NextResponse } from 'next/server';
import prisma from '@utils/prisma';
import bcrypt from 'bcrypt';
import { validateEmail } from '@utils/validateEmail';

export async function POST(request: Request) {
  const { email, password, name } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 },
    );
  }

  if (!email || !validateEmail(email)) {
    return NextResponse.json(
      { error: 'Invalid email address' },
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });

  return NextResponse.json(
    { message: 'User registered successfully' },
    { status: 201 },
  );
}

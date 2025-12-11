import { NextResponse } from 'next/server';
import prisma from '@utils/prisma';
import bcrypt from 'bcrypt';
import { validateEmail } from '@utils/validateEmail';
import { seedDemoTracksForUser } from '@utils/demoTracks';

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

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });

  // Seed demo tracks for this new user (best-effort)
  try {
    await seedDemoTracksForUser(user.id);
  } catch {
    // ignore seeding errors
  }

  return NextResponse.json(
    { message: 'User registered successfully' },
    { status: 201 },
  );
}

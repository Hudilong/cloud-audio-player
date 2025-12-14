import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcrypt';
import prisma from './prisma';
import { SafeUser } from '../types';

const isProd = process.env.NODE_ENV === 'production';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'email@example.com',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing email or password');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return user as SafeUser;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: isProd
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProd,
      },
    },
    callbackUrl: {
      name: isProd
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: isProd,
      },
    },
    csrfToken: {
      name: isProd ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProd,
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account && account.provider) {
        // Check if there is an existing account for this provider
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (!existingAccount) {
          // Check if there is a user with the same email
          if (!user.email) {
            throw new Error('Email is required for sign-in.');
          }

          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (existingUser) {
            // Update the user's image if provided by the new account
            if (user.image && existingUser.image !== user.image) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  image: user.image, // Update the image if it's different
                },
              });
            }

            // Link the new provider account to the existing user
            await prisma.account.create({
              data: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                userId: existingUser.id,
                type: account.type,
              },
            });
          } else {
            // No existing user, create a new one
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                accounts: {
                  create: {
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    type: account.type,
                  },
                },
              },
            });
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // Attach user ID to the JWT token
      if (user) {
        return {
          ...token,
          id: user.id,
          role: (user as SafeUser).role,
        };
      }

      if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { role: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Attach user ID to the session object
      if (token && session.user) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.id,
            role: token.role,
          },
        };
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      const resolvedUrl = new URL(url, baseUrl);
      const base = new URL(baseUrl);
      if (resolvedUrl.origin !== base.origin) {
        return baseUrl;
      }

      if (resolvedUrl.pathname === '/' || resolvedUrl.pathname === '/login') {
        return resolvedUrl.toString();
      }

      // Default: send signed-in users to their library
      return `${baseUrl}/library`;
    },
  },
  pages: {
    signIn: '/login', // Custom sign-in page
  },
  secret: process.env.NEXTAUTH_SECRET,
};

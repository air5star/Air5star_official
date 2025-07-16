// auth.config.ts
import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import AppleProvider from 'next-auth/providers/apple';
import { users } from './lib/users'; // your hard-coded list

const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID as string,
      clientSecret: process.env.APPLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'alice@example.com',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(creds) {
        const user = users.find(
          (u) => u.email === creds?.email && u.password === creds.password
        );
        if (user) {
          const { ...safe } = user;
          return safe;
        }
        return null;
      },
    }),
  ],

  // 1) use JWT-based sessions
  session: {
    strategy: 'jwt',
  },
  // 2) point to your App‑Router page at /login
  pages: {
    signIn: '/login',
  },
  // 3) (optional) copy your user props into the token & session
  callbacks: {
    jwt({ token, user }) {
      return user ? { ...token, ...user } : token;
    },
    session({ session, token }) {
      return { ...session, user: token as any };
    },
  },
  // 4) ensure you’ve set this in your
  //    .env: NEXTAUTH_SECRET=some‑really‑long‑value
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;

export default authConfig;

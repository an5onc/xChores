import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Parent login: email + password
    Credentials({
      id: "parent-login",
      name: "Parent Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        const user = await db.user.findUnique({
          where: { email },
          include: { family: true },
        });

        if (!user || !user.passwordHash || user.role !== "PARENT") return null;

        const isValid = await compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          familyId: user.familyId,
          avatarId: user.avatarId,
        };
      },
    }),

    // Kid login: family + avatar + PIN
    Credentials({
      id: "kid-login",
      name: "Kid Login",
      credentials: {
        userId: { label: "User ID", type: "text" },
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        const userId = credentials?.userId as string;
        const pin = credentials?.pin as string;

        if (!userId || !pin) return null;

        const user = await db.user.findUnique({
          where: { id: userId },
          include: { family: true },
        });

        if (!user || !user.pin || user.role !== "CHILD") return null;

        const isValid = await compare(pin, user.pin);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: null,
          role: user.role,
          familyId: user.familyId,
          avatarId: user.avatarId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role as string;
        token.familyId = (user as any).familyId as string;
        token.avatarId = (user as any).avatarId as number;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "PARENT" | "CHILD";
        session.user.familyId = token.familyId as string;
        session.user.avatarId = token.avatarId as number;
      }
      return session;
    },
  },
});

// src/lib/auth.config.ts — edge-safe config shared by middleware and the full
// Node config in auth.ts. MUST NOT import pg/drizzle (middleware runs on edge).
import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/modules/identity/rbac";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // Credentials provider (needs Postgres) is added in src/lib/auth.ts
  callbacks: {
    authorized({ auth }) {
      // Middleware gate: any signed-in user may read (reads are role-unrestricted
      // in v1 — contract §3); unauthenticated requests redirect to /login.
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;

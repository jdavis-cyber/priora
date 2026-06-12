// src/lib/auth.ts — Auth.js v5. Credentials provider, JWT sessions, zod-validated
// input, bcryptjs compare. auth() is the actor-identity helper used by all server
// actions (contract §4). Successful sign-ins are audited (auth.login).
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { recordAudit } from "@/modules/audit/record";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, parsed.data.email),
        });
        if (!user || !user.isActive) return null;

        const passwordOk = await compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!passwordOk) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      await recordAudit(db, {
        actorId: user.id ?? null,
        action: "auth.login",
        entityType: "user",
        entityId: user.id,
        after: { email: user.email },
      });
    },
  },
});

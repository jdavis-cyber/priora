// src/types/next-auth.d.ts — Auth.js module augmentation: sessions carry id + role.
import type { DefaultSession } from "next-auth";
import type { Role } from "@/modules/identity/rbac";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

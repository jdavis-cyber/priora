// src/middleware.ts — route-level protection. Everything except /login, /api/auth,
// and Next.js static assets requires a session (authorized callback in auth.config).
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon\\.ico|icon\\.svg).*)"],
};

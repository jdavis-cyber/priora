import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in — Priora" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-8">
      <h1 className="mb-2 text-2xl font-semibold text-zinc-100">Priora</h1>
      <p className="mb-8 text-sm text-zinc-500">
        The decisions that come before scale.
      </p>
      <LoginForm />
    </main>
  );
}

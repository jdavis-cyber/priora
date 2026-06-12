import type { Metadata } from "next";
import { APP_NAME, APP_TAGLINE } from "@/lib/app-info";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-xl font-bold text-zinc-950">
            P
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            {APP_NAME}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{APP_TAGLINE}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-zinc-600">
          AI lifecycle governance — every decision recorded, every artifact
          traceable.
        </p>
      </div>
    </main>
  );
}

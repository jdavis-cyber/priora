"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export function LoginForm() {
  const [error, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-zinc-300">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-300">
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-100 px-3 py-2 font-medium text-zinc-900 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { createProjectAction, type ActionState } from "../actions";

const initialState: ActionState = { error: null };

export default function NewProjectPage() {
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initialState,
  );

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-xl font-semibold">New project</h1>
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            placeholder="Governed AI system name"
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="criticality"
            className="mb-1 block text-sm font-medium"
          >
            Criticality
          </label>
          <select
            id="criticality"
            name="criticality"
            defaultValue="medium"
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="mission_critical">Mission critical</option>
          </select>
        </div>
        {state.error && (
          <p className="rounded bg-red-950 px-3 py-2 text-sm text-red-300">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create project (bootstraps Phases I–VI)"}
        </button>
      </form>
    </div>
  );
}

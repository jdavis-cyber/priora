import Link from "next/link";

export default function ControlsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Controls / SoA
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          63-control library (ISO/IEC 42001 Annex A + selected NIST SP 800-53),
          cloned into a per-project Statement of Applicability.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900 p-10 text-center">
        <p className="text-sm font-medium text-zinc-100">
          SoA postures live on each project
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Open a project and choose SoA to review applicability, implementation
          status, and N/A justifications.
        </p>
        <Link
          href="/projects"
          className="mt-4 inline-block rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white"
        >
          Go to Projects
        </Link>
      </div>
    </div>
  );
}

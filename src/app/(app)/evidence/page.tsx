import Link from "next/link";

export default function EvidencePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Evidence
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Evidence Locker — SHA-256 computed at ingest, tamper-detecting
          integrity verification, one-click AEP export.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900 p-10 text-center">
        <p className="text-sm font-medium text-zinc-100">
          Evidence is filed per project
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Open a project and choose Evidence to browse artifacts, verify
          integrity, or generate an Automated Evidence Package.
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

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-8 w-64 animate-pulse rounded bg-zinc-900" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-zinc-900" />
        ))}
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-lg bg-zinc-900" />
        ))}
      </div>
    </div>
  );
}

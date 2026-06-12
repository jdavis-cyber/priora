/**
 * Deterministic JSON serialization: object keys sorted recursively, array order
 * preserved. Used to hash inline-JSON evidence so that a Postgres jsonb
 * round-trip (which normalizes key order) re-verifies to the same SHA-256.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortValue);
  if (v !== null && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(obj)
        .sort()
        .map((k) => [k, sortValue(obj[k])]),
    );
  }
  return v;
}

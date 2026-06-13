# ADR-0003: Demo hosting — Vercel (Hobby) + Neon (free tier)

**Status:** Accepted (2026-06-11)

## Context

The spec (§1, §8 M6) requires a public, free-tier-hostable `demo` profile:
seeded, sanitized, reset daily, shareable by URL. Two credible zero-cost
options for a Next.js + Postgres monolith:

1. **Vercel Hobby + Neon free tier** — Next.js-native serverless hosting
   plus a separately managed serverless Postgres.
2. **Railway** — all-in-one: app container + Postgres in one project.

## Decision

**Vercel + Neon.**

- **Zero ongoing cost.** Vercel Hobby and Neon's free tier both fit a
  low-traffic portfolio demo indefinitely. Railway's free allowance is a
  trial credit model — cost risk over time.
- **Next-native.** Vercel is the reference deployment target for Next.js 15
  App Router/RSC/server actions; zero container or build plumbing to
  maintain.
- **Separation of concerns.** A separately managed Postgres (Neon) keeps
  the database's lifecycle, backups, and connection strings independent of
  the app host — the same posture an enterprise deployment would have, and
  it lets the daily GitHub Actions reset hit the DB directly without
  touching the app platform.
- **Custom domain later.** Vercel Hobby supports custom domains, so a
  vanity demo URL is a config change, not a migration.

## Consequences

- Vercel's filesystem is **ephemeral** → the local-fs storage driver cannot
  hold evidence uploads. A `vercel_blob` driver behind the existing storage
  abstraction (STORAGE_DRIVER env) closes this (M6 Task 4).
- Vercel Blob URLs are public-but-unguessable; acceptable because all demo
  evidence is small fictional fixtures (SECURITY.md documents the residual
  risk).
- Neon's pooled connection string (`-pooler` host) serves the app runtime;
  migrations and seeds use the **direct** (unpooled) connection string,
  since PgBouncer transaction pooling can break DDL/session semantics.
- Railway remains the documented fallback if Vercel Hobby terms change:
  the app is a standard Next.js + Postgres monolith with no Vercel-only
  APIs outside the swappable Blob driver.

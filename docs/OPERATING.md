# Priora — Operating Guide

Everything you need to reach, run, or move Priora — assuming you have nothing
else on hand. Written 2026-06-13 (v1 ship).

---

## 1. Just open the live demo (no install, works on your phone)

**URL: <https://priora-gules.vercel.app>**

Open it in any browser and log in:

| Role | Login | Password |
|---|---|---|
| **You (personal — same view as Governance Lead)** | `jdavis.cyber@gmail.com` | `demo-priora-2026` |
| Governance Lead | `avery.cole@priora.demo` | `demo-priora-2026` |
| Executive Sponsor | `morgan.reyes@priora.demo` | `demo-priora-2026` |
| Program Manager | `priya.natarajan@priora.demo` | `demo-priora-2026` |
| ML Engineer | `felix.okafor@priora.demo` | `demo-priora-2026` |
| Risk Officer | `dana.whitfield@priora.demo` | `demo-priora-2026` |
| Auditor (read-only) | `sam.aldous@priora.demo` | `demo-priora-2026` |

That is the whole thing. No install, no setup. Bookmark the URL.

**Sign in as yourself** with `jdavis.cyber@gmail.com` / `demo-priora-2026` — it's
seeded as a Governance Lead, so your screen is identical to Avery Cole's (full
access to every project, gate, risk, and evidence record). It survives the daily
reset.

**Forgot the URL?** Three ways back to it:

1. The repo README at <https://github.com/jdavis-cyber/priora> (open on any
   device while signed into GitHub as `jdavis-cyber`).
2. The Vercel dashboard → project **priora** → Domains → `priora-gules.vercel.app`.
3. This file (`docs/OPERATING.md`) in the repo.

---

## 2. Where everything lives

| Piece | Service | Account / location |
|---|---|---|
| The live website | Vercel | team `jdavis-cybers-projects` — sign in with Google `jdavis.cyber@gmail.com` |
| Source code | GitHub | <https://github.com/jdavis-cyber/priora> (private repo, owner `jdavis-cyber`) |
| Database | Neon (Postgres) | org **Jerome**, project `priora-demo` |
| Uploaded files | Vercel Blob | store `priora-demo` |
| Local copy on your Mac mini | folder | `/Users/just_jerome/Desktop/My_PKA/PKM/01_Projects/priora-app` |

Everything signs in with **`jdavis.cyber@gmail.com`** (Google) or the GitHub
account **`jdavis-cyber`**. There is nothing to remember beyond that.

---

## 3. Run it on a different computer (clone from GitHub)

**You only need this if you want to develop/run it locally.** To just *use* it,
see section 1 — it's a website.

**Install these first:**

- [Node.js](https://nodejs.org) 22 or newer (this project was built on 25)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (runs the
  local database)
- [git](https://git-scm.com) and access to the GitHub repo

**Get the code (the repo is private, so sign in to GitHub first):**

```bash
# easiest: GitHub CLI handles auth for a private repo
gh auth login                 # one-time, pick GitHub.com + browser
gh repo clone jdavis-cyber/priora
# OR with plain git if you have an SSH key / token set up:
# git clone https://github.com/jdavis-cyber/priora.git

cd priora
```

**Run it:**

```bash
cp .env.example .env          # the defaults already work for local development
docker compose up -d          # starts a local Postgres 17
npm ci                        # install dependencies
npm run db:migrate            # create the database tables
npm run seed -- --profile demo  # load the demo projects/users/evidence
npm run dev                   # start the app
```

Open **<http://localhost:3000>** and log in with the same demo credentials from
section 1.

**To stop:** press `Ctrl-C` in the terminal, then `docker compose down`.

**Notes:**

- You do **not** need any production secrets to run locally. `.env` is not in
  git; the committed `.env.example` has working local defaults.
- `npm test` · `npm run typecheck` · `npm run lint` check the code.

---

## 4. How the live site updates

The live demo redeploys automatically whenever code is pushed to the `main`
branch on GitHub (Vercel watches the repo). You don't deploy by hand.

Production secrets (database URL, auth secret, storage token) live only in
Vercel's project settings and GitHub Actions secrets — never in the code.

---

## 5. Daily reset (heads-up)

The demo is meant to wipe and re-seed itself every day at 09:00 UTC so visitors
always see a clean, fictional dataset. As of v1 ship that scheduled job is
committed but **not yet running** (it was waiting on GitHub Actions capacity).
Tracked in Linear as **AI-325** with the exact steps to switch it on. Until
then the demo simply keeps the data it was seeded with — nothing breaks.

---

## 6. Quick troubleshooting

- **"Where's the link again?"** → section 1.
- **Login rejected on the live site?** → use the exact emails/password above
  (all lowercase). The Auditor account is read-only by design.
- **Local `npm run dev` errors about the database?** → make sure Docker Desktop
  is running and `docker compose up -d` succeeded, then re-run `npm run db:migrate`.
- **Can't clone (403/permission)?** → the repo is private; run `gh auth login`
  as `jdavis-cyber` first.

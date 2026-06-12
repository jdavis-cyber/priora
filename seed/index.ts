// seed/index.ts — npm run seed -- --profile demo|test  (contract §4)
// Runs as the OWNER role (DATABASE_URL): seeding is provisioning, not app traffic.
// Idempotent: users upsert on email; app_meta upserts on key.
import "dotenv/config";
import { hashSync } from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { appMeta, users } from "../src/db/schema";

const SEED_VERSION = "1";
const BCRYPT_ROUNDS = 12; // spec/contract: bcryptjs, 12 rounds

type Profile = "demo" | "test";

function parseProfile(argv: string[]): Profile {
  const i = argv.indexOf("--profile");
  const value = i >= 0 ? argv[i + 1] : undefined;
  if (value === "demo" || value === "test") return value;
  console.error("Usage: npm run seed -- --profile demo|test");
  process.exit(1);
}

// Test-fixture credentials — local/CI only, never a hosted environment.
export const TEST_PASSWORD = "Priora-test-1";

const TEST_USERS = [
  {
    email: "governance.lead@priora.test",
    name: "Gail Governance",
    role: "governance_lead",
  },
  {
    email: "executive.sponsor@priora.test",
    name: "Evan Sponsor",
    role: "executive_sponsor",
  },
  {
    email: "program.manager@priora.test",
    name: "Pam Manager",
    role: "program_manager",
  },
  { email: "ml.engineer@priora.test", name: "Mei Engineer", role: "ml_engineer" },
  { email: "risk.officer@priora.test", name: "Rio Officer", role: "risk_officer" },
  { email: "auditor@priora.test", name: "Audrey Auditor", role: "auditor" },
] as const;

async function main() {
  const profile = parseProfile(process.argv.slice(2));
  if (profile === "demo") {
    console.error(
      "demo profile lands in M5 (3 storytelling projects). Use --profile test.",
    );
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const passwordHash = hashSync(TEST_PASSWORD, BCRYPT_ROUNDS);

  for (const u of TEST_USERS) {
    await db
      .insert(users)
      .values({ email: u.email, name: u.name, role: u.role, passwordHash })
      .onConflictDoUpdate({
        target: users.email,
        set: { name: u.name, role: u.role, passwordHash, isActive: true },
      });
  }

  const meta: ReadonlyArray<readonly [string, string]> = [
    ["seed_profile", profile],
    ["seed_version", SEED_VERSION],
  ];
  for (const [key, value] of meta) {
    await db
      .insert(appMeta)
      .values({ key, value })
      .onConflictDoUpdate({
        target: appMeta.key,
        set: { value, updatedAt: new Date() },
      });
  }

  console.log(
    `Seeded profile=${profile} version=${SEED_VERSION}: ${TEST_USERS.length} users (password: ${TEST_PASSWORD}).`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

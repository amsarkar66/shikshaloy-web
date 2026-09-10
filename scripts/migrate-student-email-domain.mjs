/**
 * One-off migration: rewrites existing student login emails from
 * @students.shikshaloy.app to @students.shikshaloy.com.
 *
 * Excludes the student@shikshaloy.com demo account explicitly (it never
 * matches the source domain anyway, but kept as a belt-and-suspenders check).
 *
 * By default this is a DRY RUN — it only lists what would change.
 * Pass --apply to actually perform the updates.
 *
 * Run: node scripts/migrate-student-email-domain.mjs [--apply]
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "\n❌  Missing env vars. Make sure .env.local has:\n" +
    "      NEXT_PUBLIC_SUPABASE_URL\n" +
    "      SUPABASE_SECRET_KEY\n"
  );
  process.exit(1);
}

const HEADERS = {
  "Content-Type": "application/json",
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
};

const SOURCE_DOMAIN = "@students.shikshaloy.app";
const TARGET_DOMAIN = "@students.shikshaloy.com";
const EXCLUDED_EMAILS = new Set(["student@shikshaloy.com"]);
const APPLY = process.argv.includes("--apply");

async function listAllUsers() {
  const users = [];
  let page = 1;
  const perPage = 1000;
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      { headers: HEADERS }
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to list users (page ${page}): ${res.status} ${body}`);
    }
    const data = await res.json();
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }
  return users;
}

async function updateUserEmail(userId, newEmail) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: HEADERS,
    body: JSON.stringify({ email: newEmail, email_confirm: true }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.msg || body?.message || JSON.stringify(body));
  }
  return body;
}

async function main() {
  console.log(`\n${APPLY ? "🚀  Applying" : "🔍  Dry run —"} student email domain migration…`);
  console.log(`    ${SOURCE_DOMAIN}  →  ${TARGET_DOMAIN}\n`);

  const users = await listAllUsers();
  const emailsLower = new Set(users.map((u) => (u.email || "").toLowerCase()));

  const candidates = users.filter((u) => {
    const email = (u.email || "").toLowerCase();
    if (!email.endsWith(SOURCE_DOMAIN)) return false;
    if (EXCLUDED_EMAILS.has(email)) return false;
    return true;
  });

  if (candidates.length === 0) {
    console.log("No matching accounts found. Nothing to do.\n");
    return;
  }

  console.log(`Found ${candidates.length} account(s) to migrate:\n`);

  let updated = 0;
  let skippedCollision = 0;
  let failed = 0;

  for (const u of candidates) {
    const oldEmail = u.email;
    const newEmail = oldEmail.slice(0, -SOURCE_DOMAIN.length) + TARGET_DOMAIN;

    if (emailsLower.has(newEmail.toLowerCase())) {
      console.log(`  ⚠️  SKIP (target already exists): ${oldEmail} → ${newEmail}`);
      skippedCollision += 1;
      continue;
    }

    if (!APPLY) {
      console.log(`  would update: ${oldEmail}  →  ${newEmail}`);
      continue;
    }

    try {
      await updateUserEmail(u.id, newEmail);
      console.log(`  ✅  ${oldEmail}  →  ${newEmail}`);
      updated += 1;
    } catch (err) {
      console.log(`  ❌  FAILED ${oldEmail}: ${err.message}`);
      failed += 1;
    }
  }

  console.log("");
  if (APPLY) {
    console.log(`Done. Updated ${updated}, skipped (collision) ${skippedCollision}, failed ${failed}.\n`);
  } else {
    console.log(`Dry run complete. ${candidates.length} account(s) would be updated (${skippedCollision} collision(s) would be skipped).`);
    console.log("Re-run with --apply to perform the update.\n");
  }
}

main().catch((err) => {
  console.error("\n❌  Migration failed:", err.message, "\n");
  process.exit(1);
});

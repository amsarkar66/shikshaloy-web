/**
 * Creates the teacher@shikshaloy.com demo account via Supabase Admin REST API.
 * Run: node scripts/seed-teacher.mjs
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "\n❌  Missing env vars. Make sure .env.local has:\n" +
    "      NEXT_PUBLIC_SUPABASE_URL\n" +
    "      SUPABASE_SERVICE_ROLE_KEY\n"
  );
  process.exit(1);
}

const HEADERS = {
  "Content-Type": "application/json",
  "apikey": SERVICE_ROLE_KEY,
  "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
};

const EMAIL = "teacher@shikshaloy.com";
const PASSWORD = "Teacher@123";

async function main() {
  console.log("\n🌱  Seeding teacher account…");

  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(EMAIL)}`, {
    headers: HEADERS,
  });
  const listData = await listRes.json();
  const existing = listData?.users?.find((u) => u.email === EMAIL);

  if (existing) {
    console.log(`ℹ️   ${EMAIL} already exists — skipping.\n`);
    console.log(`    User ID : ${existing.id}`);
    console.log(`    Role    : ${existing.user_metadata?.role}\n`);
    process.exit(0);
  }

  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        role: "teacher",
        full_name: "Shikshaloy Teacher",
        status: "active",
      },
    }),
  });

  const user = await createRes.json();

  if (!createRes.ok) {
    console.error("\n❌  Failed:", user?.msg || user?.message || JSON.stringify(user), "\n");
    process.exit(1);
  }

  console.log("\n✅  Teacher account created!");
  console.log(`    Email    : ${user.email}`);
  console.log(`    Password : ${PASSWORD}`);
  console.log(`    Role     : ${user.user_metadata?.role}`);
  console.log(`    User ID  : ${user.id}`);
  console.log("\n⚠️   Change this password in production.\n");
}

main();

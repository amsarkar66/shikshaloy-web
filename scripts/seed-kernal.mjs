/**
 * Creates the kernal@shikshaloy.com demo account via Supabase Admin REST API.
 * Run: node scripts/seed-kernal.mjs
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

const KERNAL_EMAIL = "kernal@shikshaloy.com";
const KERNAL_PASSWORD = "Kernal@123";

async function main() {
  console.log("\n🌱  Seeding kernal account…");

  // Check if user already exists
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(KERNAL_EMAIL)}`, {
    headers: HEADERS,
  });
  const listData = await listRes.json();
  const existing = listData?.users?.find((u) => u.email === KERNAL_EMAIL);

  if (existing) {
    console.log(`ℹ️   ${KERNAL_EMAIL} already exists — skipping.\n`);
    console.log(`    User ID : ${existing.id}`);
    console.log(`    Role    : ${existing.user_metadata?.role}\n`);
    process.exit(0);
  }

  // Create the user
  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      email: KERNAL_EMAIL,
      password: KERNAL_PASSWORD,
      email_confirm: true,
      user_metadata: {
        role: "kernal",
        full_name: "Shikshaloy Kernal",
        status: "active",
      },
    }),
  });

  const user = await createRes.json();

  if (!createRes.ok) {
    console.error("\n❌  Failed:", user?.msg || user?.message || JSON.stringify(user), "\n");
    process.exit(1);
  }

  console.log("\n✅  Kernal account created!");
  console.log(`    Email    : ${user.email}`);
  console.log(`    Password : ${KERNAL_PASSWORD}`);
  console.log(`    Role     : ${user.user_metadata?.role}`);
  console.log(`    User ID  : ${user.id}`);
  console.log("\n⚠️   Change this password in production.\n");
}

main();

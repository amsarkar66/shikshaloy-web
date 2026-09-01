/**
 * Creates demo grievances for a test school via Supabase REST API.
 * Run: node scripts/seed-grievances.mjs "AMS Test School"
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
  "apikey": SERVICE_ROLE_KEY,
  "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
};

const SCHOOL_NAME = process.argv[2] || "AMS Test School";

const DEMO_GRIEVANCES = [
  {
    name: "Rahim Uddin",
    email: "rahim.uddin@example.com",
    phone: "+8801711000111",
    category: "academic",
    subject: "Extra homework load in Class 8",
    message:
      "My son is getting an unusually heavy amount of homework from the science teacher every day, leaving almost no time for other subjects. Could this be reviewed and balanced across subjects?",
    status: "open",
  },
  {
    name: "Farzana Akter",
    email: "farzana.akter@example.com",
    phone: "+8801711000222",
    category: "transport",
    subject: "School bus arriving 20 minutes late",
    message:
      "The Mirpur route bus has been arriving 15-20 minutes late for the past two weeks, which makes my daughter late for the morning assembly. Please look into the route schedule.",
    status: "in_review",
    resolution_notes: "Spoke with the transport coordinator; route timing is being adjusted starting next week.",
  },
  {
    name: "Kamal Hossain",
    email: "kamal.hossain@example.com",
    phone: "+8801711000333",
    category: "facilities",
    subject: "Broken fan in Class 6 section B",
    message:
      "The ceiling fan in Class 6, Section B has not been working for over a week. With the current heat, it's very uncomfortable for the students during afternoon classes.",
    status: "resolved",
    resolution_notes: "Fan was replaced by the maintenance team on the same day this was reported.",
  },
  {
    name: "Nasrin Sultana",
    email: "nasrin.sultana@example.com",
    phone: "+8801711000444",
    category: "fees",
    subject: "Discrepancy in the fee receipt amount",
    message:
      "The fee receipt I received for this month shows an amount that doesn't match what was quoted at admission. Could someone from accounts clarify the breakdown?",
    status: "open",
  },
  {
    name: "Abdul Karim",
    email: "abdul.karim@example.com",
    phone: "+8801711000555",
    category: "staff",
    subject: "Concern about a substitute teacher's conduct",
    message:
      "My child mentioned that a substitute teacher raised their voice at students during a math class last Thursday. I would appreciate it if this could be looked into.",
    status: "in_review",
  },
  {
    name: "Shirin Begum",
    email: "",
    phone: "+8801711000666",
    category: "other",
    subject: "Request for a parent-teacher meeting slot",
    message:
      "I was unable to attend the last parent-teacher meeting due to a scheduling conflict. Is it possible to arrange a separate short meeting with the class teacher?",
    status: "resolved",
    resolution_notes: "Meeting scheduled and completed with the class teacher on the following Saturday.",
  },
];

async function main() {
  console.log(`\n🌱  Looking up school "${SCHOOL_NAME}"…`);

  const schoolRes = await fetch(
    `${SUPABASE_URL}/rest/v1/schools?name=eq.${encodeURIComponent(SCHOOL_NAME)}&select=id,name`,
    { headers: HEADERS }
  );
  const schools = await schoolRes.json();

  if (!schoolRes.ok || !Array.isArray(schools) || schools.length === 0) {
    console.error(`\n❌  Could not find a school named "${SCHOOL_NAME}".`, schools);
    process.exit(1);
  }

  const school = schools[0];
  console.log(`✅  Found school: ${school.name} (${school.id})`);

  const rows = DEMO_GRIEVANCES.map((g) => ({
    school_id: school.id,
    name: g.name,
    email: g.email || null,
    phone: g.phone || null,
    category: g.category,
    subject: g.subject,
    message: g.message,
    status: g.status,
    resolution_notes: g.resolution_notes || null,
  }));

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/grievances`, {
    method: "POST",
    headers: { ...HEADERS, Prefer: "return=representation" },
    body: JSON.stringify(rows),
  });

  const inserted = await insertRes.json();

  if (!insertRes.ok) {
    console.error("\n❌  Failed to insert grievances:", inserted);
    process.exit(1);
  }

  console.log(`\n✅  Inserted ${inserted.length} demo grievances into "${school.name}".\n`);
}

main();

/**
 * Seeds subjects and section_subjects into Supabase.
 * Run: npx tsx scripts/seed-subjects.ts
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const URL    = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
const KEY    = process.env.SUPABASE_SECRET_KEY!;
const SCHOOL = "00000000-0000-0000-0000-000000000001";
const AY     = "00000000-0000-0000-0000-000000000002";

async function rest(method: string, path: string, body?: unknown) {
  const res = await fetch(`${URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type":  "application/json",
      Prefer: method === "POST" ? "resolution=merge-duplicates,return=minimal" : "return=minimal",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) { console.error(`${method} ${path} → ${res.status}: ${text}`); process.exit(1); }
  return text ? JSON.parse(text) : null;
}

const SUBJECTS = [
  { uuid: "00000000-0000-0000-0000-000000000031", name: "Mathematics",           code: "MATH", type: "core",     status: "active",   wk: 6, classes: ["5","6","7","8","9","10"] },
  { uuid: "00000000-0000-0000-0000-000000000032", name: "English Language",      code: "ENG",  type: "core",     status: "active",   wk: 5, classes: ["5","6","7","8","9","10"] },
  { uuid: "00000000-0000-0000-0000-000000000033", name: "Science",               code: "SCI",  type: "core",     status: "active",   wk: 5, classes: ["5","6","7","8"] },
  { uuid: "00000000-0000-0000-0000-000000000034", name: "Physics",               code: "PHY",  type: "core",     status: "active",   wk: 5, classes: ["9","10"] },
  { uuid: "00000000-0000-0000-0000-000000000035", name: "Chemistry",             code: "CHE",  type: "core",     status: "active",   wk: 5, classes: ["9","10"] },
  { uuid: "00000000-0000-0000-0000-000000000036", name: "Biology",               code: "BIO",  type: "core",     status: "active",   wk: 4, classes: ["9","10"] },
  { uuid: "00000000-0000-0000-0000-000000000037", name: "Social Studies",        code: "SST",  type: "core",     status: "active",   wk: 4, classes: ["5","6","7","8"] },
  { uuid: "00000000-0000-0000-0000-000000000038", name: "History & Civics",      code: "HIS",  type: "core",     status: "active",   wk: 4, classes: ["9","10"] },
  { uuid: "00000000-0000-0000-0000-000000000039", name: "Geography",             code: "GEO",  type: "core",     status: "active",   wk: 3, classes: ["9","10"] },
  { uuid: "00000000-0000-0000-0000-000000000040", name: "Hindi",                 code: "HIN",  type: "core",     status: "active",   wk: 4, classes: ["5","6","7","8","9","10"] },
  { uuid: "00000000-0000-0000-0000-000000000041", name: "Computer Science",      code: "CS",   type: "core",     status: "active",   wk: 3, classes: ["8","9","10"] },
  { uuid: "00000000-0000-0000-0000-000000000042", name: "Physical Education",    code: "PE",   type: "core",     status: "active",   wk: 2, classes: ["5","6","7","8","9","10"] },
  { uuid: "00000000-0000-0000-0000-000000000043", name: "Art & Craft",           code: "ART",  type: "elective", status: "active",   wk: 2, classes: ["5","6","7"] },
  { uuid: "00000000-0000-0000-0000-000000000044", name: "Music",                 code: "MUS",  type: "elective", status: "active",   wk: 2, classes: ["5","6","7","8"] },
  { uuid: "00000000-0000-0000-0000-000000000045", name: "Dance",                 code: "DAN",  type: "elective", status: "active",   wk: 2, classes: ["5","6"] },
  { uuid: "00000000-0000-0000-0000-000000000046", name: "Environmental Science", code: "EVS",  type: "core",     status: "active",   wk: 3, classes: ["5","6"] },
  { uuid: "00000000-0000-0000-0000-000000000047", name: "Economics",             code: "ECO",  type: "elective", status: "active",   wk: 4, classes: ["9","10"] },
  { uuid: "00000000-0000-0000-0000-000000000048", name: "Sanskrit",              code: "SAN",  type: "elective", status: "inactive", wk: 3, classes: ["6","7","8"] },
  { uuid: "00000000-0000-0000-0000-000000000049", name: "French",                code: "FRE",  type: "elective", status: "active",   wk: 3, classes: ["8","9","10"] },
  { uuid: "00000000-0000-0000-0000-000000000050", name: "Information Technology",code: "IT",   type: "elective", status: "inactive", wk: 2, classes: ["9","10"] },
];

async function seed() {
  // 1. Upsert subjects
  const subjectRows = SUBJECTS.map((s) => ({
    id: s.uuid, school_id: SCHOOL, name: s.name, code: s.code,
    type: s.type, status: s.status, weekly_periods: s.wk,
  }));
  await rest("POST", "/subjects", subjectRows);
  console.log(`✓ Upserted ${subjectRows.length} subjects`);

  // 2. Fetch sections with their grade levels
  const sections: Array<{ id: string; name: string; grades: { level: number } }> =
    await rest("GET", `/sections?select=id,name,grades(level)&school_id=eq.${SCHOOL}&academic_year_id=eq.${AY}`);

  const levelToSections: Record<string, string[]> = {};
  for (const sec of sections) {
    const level = String(sec.grades?.level ?? "");
    if (!level) continue;
    if (!levelToSections[level]) levelToSections[level] = [];
    levelToSections[level].push(sec.id);
  }
  console.log(`✓ Found ${sections.length} sections across grades: ${Object.keys(levelToSections).join(", ")}`);

  // 3. Delete existing section_subjects for this AY
  await rest("DELETE", `/section_subjects?school_id=eq.${SCHOOL}&academic_year_id=eq.${AY}`, undefined);
  console.log("✓ Cleared existing section_subjects");

  // 4. Insert section_subjects
  const ssRows: Array<{ school_id: string; section_id: string; subject_id: string; academic_year_id: string }> = [];
  for (const sub of SUBJECTS) {
    for (const gradeLevel of sub.classes) {
      for (const sectionId of (levelToSections[gradeLevel] ?? [])) {
        ssRows.push({ school_id: SCHOOL, section_id: sectionId, subject_id: sub.uuid, academic_year_id: AY });
      }
    }
  }

  if (ssRows.length > 0) {
    await rest("POST", "/section_subjects", ssRows);
    console.log(`✓ Inserted ${ssRows.length} section_subjects`);
  }

  console.log("Done!");
}

seed().catch((e) => { console.error(e); process.exit(1); });

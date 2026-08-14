import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { resolveKeyOwner, schoolBelongsToOwner, CORS_HEADERS } from "@/lib/publish-keys/resolve";

interface ExamResultRow {
  id: string;
  marks_obtained: number | null;
  max_marks: number | null;
  grade: string | null;
  is_absent: boolean;
  exams: { name: string; status: string } | null;
  subjects: { name: string } | null;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  const resolved = await resolveKeyOwner(request);
  if (!resolved) return jsonError("Invalid or revoked publish key", 401);

  const body = await request.json().catch(() => null);
  if (!body) return jsonError("Invalid request body", 400);

  const { schoolId, admissionNo, dob } = body as Record<string, string>;
  if (!schoolId || !admissionNo?.trim() || !dob) {
    return jsonError("Missing required fields", 400);
  }

  if (!(await schoolBelongsToOwner(schoolId, resolved.ownerId))) {
    return jsonError("No matching record found", 404);
  }

  const { data: student } = await supabaseAdmin
    .from("students")
    .select("id, full_name")
    .eq("school_id", schoolId)
    .eq("admission_no", admissionNo.trim())
    .eq("dob", dob)
    .maybeSingle();

  if (!student) {
    return jsonError("No matching record found", 404);
  }

  const { data: resultRows } = await supabaseAdmin
    .from("exam_results")
    .select("id, marks_obtained, max_marks, grade, is_absent, exams!inner(name, status), subjects(name)")
    .eq("student_id", student.id)
    .eq("exams.status", "published");

  const results = ((resultRows ?? []) as unknown as ExamResultRow[]).map((r) => ({
    id: r.id,
    examName: r.exams?.name ?? "",
    subject: r.subjects?.name ?? "",
    marksObtained: r.marks_obtained,
    maxMarks: r.max_marks,
    grade: r.grade,
    isAbsent: r.is_absent,
  }));

  return NextResponse.json({ studentName: student.full_name, results }, { headers: CORS_HEADERS });
}

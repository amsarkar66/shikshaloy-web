// A grade-specific fee_structures row always wins over an "all grades" row for
// the same purpose (e.g. a Class 10 admission fee overrides a school-wide
// default) — shared so billing (lib/students/enroll.ts) and display
// (app/dashboard/fees/actions.ts) can never resolve this differently.
export function pickGradeApplicable<T extends { grade_id: string | null }>(rows: T[], gradeId: string): T[] {
  const gradeSpecific = rows.filter((r) => r.grade_id === gradeId);
  return gradeSpecific.length > 0 ? gradeSpecific : rows.filter((r) => r.grade_id === null);
}

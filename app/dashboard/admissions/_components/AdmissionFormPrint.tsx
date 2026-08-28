import { formatDate, calcAge } from "../_data/admissions";
import type { Application } from "./AdmissionsClient";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-baseline gap-2 border-b border-dotted border-gray-300 py-1">
      <span className="w-40 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <span className="flex-1 text-[12px] text-gray-900">{value || " "}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="break-inside-avoid">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-700 border-b-2 border-gray-800 pb-1">{title}</p>
      <div>{children}</div>
    </div>
  );
}

export function AdmissionFormPrint({
  app, schoolName, schoolLogoUrl,
}: {
  app: Application;
  schoolName: string;
  schoolLogoUrl: string | null;
}) {
  return (
    <div className="admission-form-print hidden print:block bg-white text-gray-900 p-8">
      <div className="flex items-center gap-4 border-b-2 border-gray-800 pb-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-300">
          {schoolLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={schoolLogoUrl} alt={schoolName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-gray-500">{initials(schoolName)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold uppercase tracking-wide">{schoolName}</p>
          <p className="text-xs text-gray-600">Admission Application Form</p>
        </div>
        {app.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={app.photoUrl} alt={app.applicantName} className="h-20 w-20 shrink-0 rounded object-cover border border-gray-300" />
        )}
      </div>

      <div className="flex items-center justify-between mt-3 mb-4 text-[11px] text-gray-600">
        <span>Application No: <span className="font-semibold text-gray-900">{app.applicationNo}</span></span>
        <span>Academic Year: <span className="font-semibold text-gray-900">{app.academicYear}</span></span>
        <span>Submitted: <span className="font-semibold text-gray-900">{formatDate(app.submittedDate)}</span></span>
      </div>

      <div className="space-y-4">
        <Section title="Applicant Information">
          <Row label="Full Name" value={app.applicantName} />
          <Row label="Date of Birth" value={app.dob ? `${formatDate(app.dob)} (Age ${calcAge(app.dob, app.academicYear)})` : ""} />
          <Row label="Gender" value={app.gender} />
          <Row label="Applying For" value={`Class ${app.applyingForClass}`} />
          <Row label="Previous School" value={app.previousSchool} />
          <Row label="Blood Group" value={app.bloodGroup} />
          <Row label="Category" value={app.category} />
          <Row label="Nationality" value={app.nationality} />
          <Row label="Address" value={app.address} />
        </Section>

        <Section title="Parent / Guardian Contact">
          <Row label="Full Name" value={app.parentName} />
          <Row label="Phone" value={app.parentPhone} />
          <Row label="Email" value={app.parentEmail} />
        </Section>

        {(app.fatherName || app.motherName || app.guardianName) && (
          <Section title="Family Details">
            {app.fatherName && (
              <>
                <Row label="Father's Name" value={app.fatherName} />
                <Row label="Father's Occupation" value={app.fatherOccupation} />
                <Row label="Father's Phone" value={app.fatherPhone} />
                <Row label="Father's Email" value={app.fatherEmail} />
              </>
            )}
            {app.motherName && (
              <>
                <Row label="Mother's Name" value={app.motherName} />
                <Row label="Mother's Occupation" value={app.motherOccupation} />
                <Row label="Mother's Phone" value={app.motherPhone} />
                <Row label="Mother's Email" value={app.motherEmail} />
              </>
            )}
            {app.guardianName && (
              <>
                <Row label="Guardian's Name" value={app.guardianName} />
                <Row label="Guardian's Relation" value={app.guardianRelation} />
                <Row label="Guardian's Phone" value={app.guardianPhone} />
              </>
            )}
          </Section>
        )}

        {(app.siblingStudying || app.emergencyContactName) && (
          <Section title="Additional Details">
            {app.siblingStudying && <Row label="Sibling at School" value={app.siblingName || "Yes"} />}
            {app.emergencyContactName && <Row label="Emergency Contact" value={`${app.emergencyContactName} · ${app.emergencyContactPhone ?? ""}`} />}
          </Section>
        )}

        {app.notes && (
          <Section title="Notes">
            <p className="text-[12px] text-gray-900 leading-relaxed py-1">{app.notes}</p>
          </Section>
        )}
      </div>

      <p className="mt-8 text-[11px] text-gray-700 leading-relaxed">
        I/We hereby declare that the information given above is true to the best of my/our knowledge and belief.
      </p>

      <div className="mt-10 flex items-end justify-between text-[11px] text-gray-700">
        <div className="w-56">
          <div className="h-10 border-b border-gray-500" />
          <p className="mt-1">Parent / Guardian Signature</p>
        </div>
        <div className="w-40">
          <div className="h-10 border-b border-gray-500" />
          <p className="mt-1">Date</p>
        </div>
      </div>

      <div className="mt-10 pt-4 border-t border-gray-300">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">For Office Use Only</p>
        <div className="flex items-end justify-between text-[11px] text-gray-700">
          <div className="w-56">
            <div className="h-10 border-b border-gray-500" />
            <p className="mt-1">Verified By</p>
          </div>
          <div className="w-40">
            <div className="h-10 border-b border-gray-500" />
            <p className="mt-1">Signature & Date</p>
          </div>
        </div>
      </div>
    </div>
  );
}

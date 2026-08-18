import { CERT_DOCUMENT_TITLE, certificateBody, formatDate } from "../_data/certificates";
import type { Cert } from "./CertificatesClient";

export function CertificateDocument({
  cert, schoolName, schoolAddress, schoolLogoUrl, academicYear,
}: {
  cert: Cert;
  schoolName: string;
  schoolAddress: string;
  schoolLogoUrl: string | null;
  academicYear: string;
}) {
  const isRejected = cert.status === "rejected";
  const isDraft = !isRejected && cert.status !== "issued";
  const body = certificateBody({
    certType: cert.certType,
    studentName: cert.studentName,
    rollNo: cert.rollNo || "—",
    classLabel: `${cert.class || "—"}-${cert.section || "—"}`,
    purpose: cert.purpose || "official use",
    schoolName,
    academicYear,
  });

  return (
    <div
      className="certificate-page relative mx-auto flex flex-col bg-white text-gray-900"
      style={{ width: "210mm", minHeight: "297mm", padding: "20mm" }}
    >
      {(isDraft || isRejected) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <span className="rotate-[-28deg] select-none text-[90px] font-extrabold tracking-widest text-gray-200">
            {isRejected ? "REJECTED" : "DRAFT"}
          </span>
        </div>
      )}

      <div className="relative flex items-center gap-4 border-b-2 border-gray-800 pb-4">
        {schoolLogoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={schoolLogoUrl} alt="" className="h-16 w-16 shrink-0 object-contain" />
        )}
        <div className="min-w-0">
          <p className="text-2xl font-bold uppercase tracking-wide">{schoolName}</p>
          {schoolAddress && <p className="text-sm text-gray-600">{schoolAddress}</p>}
        </div>
      </div>

      <div className="relative mt-10 text-center">
        <p className="inline-block border-b-2 border-gray-800 pb-1 text-xl font-bold uppercase tracking-[0.15em]">
          {CERT_DOCUMENT_TITLE[cert.certType]}
        </p>
      </div>

      <div className="relative mt-10 space-y-5 text-justify text-[15px] leading-8">
        {body.map((p, i) => <p key={i}>{p}</p>)}
      </div>

      <div className="relative mt-auto flex items-end justify-between pt-16">
        <div>
          <p className="text-sm text-gray-600">Date of Issue</p>
          <p className="font-medium">{formatDate(cert.issuedOn ?? cert.requestedOn)}</p>
        </div>
        <div className="text-center">
          <div className="mb-1 h-10 w-40 border-b border-gray-500" />
          <p className="text-sm font-medium">Principal</p>
        </div>
      </div>
    </div>
  );
}

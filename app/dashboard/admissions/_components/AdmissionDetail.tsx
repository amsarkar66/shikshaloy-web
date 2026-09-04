"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, GraduationCap,
  ArrowLeft, Phone, Mail, CalendarDays, StickyNote,
  FileText, Loader2, Pencil, X, Trash2, Printer,
} from "lucide-react";
import {
  STATUS_LABEL, STATUS_BADGE, formatDate, calcAge, TRANSITIONS,
  type AdmissionStatus, type Transition,
} from "../_data/admissions";
import {
  updateApplicationStatus, enrollApplication, deleteAdmissionDocument,
  type EnrollResult,
} from "../actions";
import type { PaymentMode } from "../../fees/_data/fees";
import { CredentialsDialog } from "./CredentialsDialog";
import { EnrollmentSuccessModal } from "./EnrollmentSuccessModal";
import { StatusReasonDialog } from "./StatusReasonDialog";
import { EnrollFeeDialog } from "./EnrollFeeDialog";
import type { Application } from "./AdmissionsClient";
import { AdmissionFormPrint } from "./AdmissionFormPrint";
import { formatAddress } from "@/lib/students/address";

export interface AdmissionDocument {
  id: string;
  category: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

function DocumentPreviewModal({ doc, onClose }: { doc: AdmissionDocument; onClose: () => void }) {
  const isImage = IMAGE_EXT.test(doc.fileUrl);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[85vh] rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{doc.category}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">{doc.fileName}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">Open</a>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-zinc-950/40 flex items-center justify-center">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doc.fileUrl} alt={doc.fileName} className="max-h-[70vh] w-auto object-contain" />
          ) : (
            <iframe src={doc.fileUrl} title={doc.fileName} className="h-[70vh] w-full" />
          )}
        </div>
      </div>
    </div>
  );
}

export function AdmissionDetail({
  app: initial, documents: initialDocuments, schoolName, schoolLogoUrl,
}: {
  app: Application;
  documents: AdmissionDocument[];
  schoolName: string;
  schoolLogoUrl: string | null;
}) {
  const router = useRouter();
  const [status, setStatus]     = useState<AdmissionStatus>(initial.status);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [credentials, setCredentials] = useState<EnrollResult | null>(null);
  const [showEnrollSuccess, setShowEnrollSuccess] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<Transition | null>(null);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<AdmissionDocument | null>(null);
  const [documents, setDocuments] = useState(initialDocuments);
  const [docBusyId, setDocBusyId] = useState<string | null>(null);

  const transitions = TRANSITIONS[status] ?? [];

  async function runTransition(next: AdmissionStatus, reason?: string) {
    setError(null);
    setBusy(true);
    try {
      await updateApplicationStatus(initial.id, next, reason);
      setStatus(next);
      setPendingTransition(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnroll(collectedAmount: number, paymentMode: PaymentMode) {
    setError(null);
    setBusy(true);
    try {
      const result = await enrollApplication(initial.id, { collectedAmount, paymentMode });
      setCredentials(result);
      setShowEnrollSuccess(true);
      setStatus("enrolled");
      setShowEnrollDialog(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function handleTransitionClick(t: Transition) {
    if (t.status === "enrolled") {
      setShowEnrollDialog(true);
    } else if (t.requiresReason) {
      setPendingTransition(t);
    } else {
      runTransition(t.status);
    }
  }

  async function handleDeleteDocument(doc: AdmissionDocument) {
    setDocBusyId(doc.id);
    try {
      await deleteAdmissionDocument(doc.id, initial.id);
      setDocuments((docs) => docs.filter((d) => d.id !== doc.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete document");
    } finally {
      setDocBusyId(null);
    }
  }

  return (
    <>
    <div className="w-full px-6 py-6 space-y-5 print:hidden">
      {showEnrollSuccess && (
        <EnrollmentSuccessModal
          studentName={initial.applicantName}
          onContinue={() => setShowEnrollSuccess(false)}
        />
      )}
      {credentials && !showEnrollSuccess && (
        <CredentialsDialog
          result={credentials}
          studentName={initial.applicantName}
          onClose={() => setCredentials(null)}
        />
      )}
      {pendingTransition && (
        <StatusReasonDialog
          actionLabel={pendingTransition.label}
          busy={busy}
          onCancel={() => setPendingTransition(null)}
          onConfirm={(reason) => runTransition(pendingTransition.status, reason)}
        />
      )}
      {previewDoc && <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
      {showEnrollDialog && (
        <EnrollFeeDialog
          applicantName={initial.applicantName}
          applyingForGrade={initial.applyingForClass}
          academicYearId={initial.academicYearId}
          busy={busy}
          error={error}
          onCancel={() => setShowEnrollDialog(false)}
          onConfirm={confirmEnroll}
        />
      )}

      <div className="space-y-3">
        <Link href="/dashboard/admissions" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors w-fit"><ArrowLeft className="h-4 w-4"/> All Applications</Link>
        <div className="flex items-center gap-3 flex-wrap">
          <p className="font-mono text-sm text-gray-400 dark:text-zinc-500">{initial.applicationNo}</p>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">{initial.academicYear} · Submitted {formatDate(initial.submittedDate)}</span>
          <div className="ml-auto flex flex-nowrap items-center gap-2 overflow-x-auto">
            <button
              onClick={() => window.print()}
              disabled={busy}
              className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-200 dark:border-zinc-700 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              <Printer className="h-3.5 w-3.5"/>Download PDF
            </button>
            <Link
              href={`/dashboard/admissions/${initial.id}/edit`}
              className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-200 dark:border-zinc-700 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5"/>Edit details
            </Link>
            {transitions.map((t)=>(
              <button
                key={t.status}
                onClick={()=>handleTransitionClick(t)}
                disabled={busy}
                className={`flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-xs font-medium transition-colors disabled:opacity-50 ${t.style}`}
              >
                {busy?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<t.icon className="h-3.5 w-3.5"/>}{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {initial.statusReason && (status==="rejected"||status==="waitlisted") && (
        <div className="rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 px-4 py-2.5 text-sm text-gray-600 dark:text-zinc-300">
          <span className="font-medium text-gray-800 dark:text-zinc-100">Reason: </span>{initial.statusReason}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-4">
          <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary-500"/><h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Applicant Information</h3></div>
          {initial.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={initial.photoUrl} alt={initial.applicantName} className="h-20 w-20 rounded-xl object-cover border border-gray-200 dark:border-zinc-700" />
          )}
          <div className="space-y-3">
            {[
              { label:"Full Name",       value:initial.applicantName },
              { label:"Date of Birth",   value:`${formatDate(initial.dob)} (Age ${calcAge(initial.dob, initial.academicYear)})` },
              { label:"Gender",          value:initial.gender },
              { label:"Applying For",    value:`Class ${initial.applyingForClass}` },
              { label:"Previous School", value:initial.previousSchool??"—" },
              { label:"Blood Group",     value:initial.bloodGroup??"—" },
              { label:"Category",        value:initial.category??"—" },
              { label:"Nationality",     value:initial.nationality??"—" },
              { label:"Present Address",   value:formatAddress(initial.presentAddress) || "—" },
              { label:"Permanent Address", value:formatAddress(initial.permanentAddress) || "—" },
            ].map((row)=>(
              <div key={row.label} className="flex items-start gap-3">
                <span className="w-32 shrink-0 text-xs text-gray-400 dark:text-zinc-500 pt-0.5">{row.label}</span>
                <span className="text-sm font-medium text-gray-800 dark:text-zinc-200">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-4">
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary-500"/><h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Parent / Guardian</h3></div>
          <div className="space-y-3">
            <div className="flex items-start gap-3"><span className="w-32 shrink-0 text-xs text-gray-400 dark:text-zinc-500 pt-0.5">Full Name</span><span className="text-sm font-medium text-gray-800 dark:text-zinc-200">{initial.parentName}</span></div>
            <div className="flex items-center gap-3"><span className="w-32 shrink-0 text-xs text-gray-400 dark:text-zinc-500">Phone</span><a href={`tel:${initial.parentPhone}`} className="flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"><Phone className="h-3.5 w-3.5"/>{initial.parentPhone}</a></div>
            <div className="flex items-center gap-3"><span className="w-32 shrink-0 text-xs text-gray-400 dark:text-zinc-500">Email</span><a href={`mailto:${initial.parentEmail}`} className="flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline truncate"><Mail className="h-3.5 w-3.5 shrink-0"/>{initial.parentEmail}</a></div>
            {initial.parentQualification && <div className="flex items-start gap-3"><span className="w-32 shrink-0 text-xs text-gray-400 dark:text-zinc-500 pt-0.5">Qualification</span><span className="text-sm font-medium text-gray-800 dark:text-zinc-200">{initial.parentQualification}</span></div>}
            {initial.parentOccupation && <div className="flex items-start gap-3"><span className="w-32 shrink-0 text-xs text-gray-400 dark:text-zinc-500 pt-0.5">Occupation</span><span className="text-sm font-medium text-gray-800 dark:text-zinc-200">{initial.parentOccupation}</span></div>}
          </div>
          <div className="pt-3 border-t border-gray-100 dark:border-zinc-700/50">
            <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5">Documents</p>
            {documents.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-500">No documents uploaded.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const isImage = IMAGE_EXT.test(doc.fileUrl);
                  return (
                    <div
                      key={doc.id}
                      className="group flex items-center gap-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-700/40 transition-colors cursor-pointer"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={doc.fileUrl} alt={doc.fileName} className="h-8 w-8 shrink-0 rounded object-cover border border-gray-200 dark:border-zinc-700" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 dark:text-zinc-200">{doc.category}</p>
                        <p className="truncate text-[11px] text-gray-400 dark:text-zinc-500">{doc.fileName}</p>
                      </div>
                      <span className="shrink-0 text-[11px] font-medium text-primary-600 dark:text-primary-400">Preview</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc); }}
                        disabled={docBusyId === doc.id}
                        className="shrink-0 text-gray-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        title="Delete document"
                      >
                        {docBusyId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {(initial.fatherName||initial.motherName||initial.guardianName||initial.siblingStudying||initial.emergencyContactName)&&(
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-4">
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary-500"/><h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Family & Emergency Details</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {initial.fatherName&&(
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Father</p>
                <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{initial.fatherName}</p>
                {initial.fatherQualification&&<p className="text-xs text-gray-400 dark:text-zinc-500">{initial.fatherQualification}</p>}
                {initial.fatherOccupation&&<p className="text-xs text-gray-400 dark:text-zinc-500">{initial.fatherOccupation}</p>}
                {initial.fatherPhone&&<p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{initial.fatherPhone}</p>}
                {initial.fatherEmail&&<p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{initial.fatherEmail}</p>}
              </div>
            )}
            {initial.motherName&&(
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Mother</p>
                <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{initial.motherName}</p>
                {initial.motherQualification&&<p className="text-xs text-gray-400 dark:text-zinc-500">{initial.motherQualification}</p>}
                {initial.motherOccupation&&<p className="text-xs text-gray-400 dark:text-zinc-500">{initial.motherOccupation}</p>}
                {initial.motherPhone&&<p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{initial.motherPhone}</p>}
                {initial.motherEmail&&<p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{initial.motherEmail}</p>}
              </div>
            )}
            {initial.guardianName&&(
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Guardian</p>
                <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{initial.guardianName}</p>
                {initial.guardianRelation&&<p className="text-xs text-gray-400 dark:text-zinc-500">{initial.guardianRelation}</p>}
                {initial.guardianQualification&&<p className="text-xs text-gray-400 dark:text-zinc-500">{initial.guardianQualification}</p>}
                {initial.guardianOccupation&&<p className="text-xs text-gray-400 dark:text-zinc-500">{initial.guardianOccupation}</p>}
                {initial.guardianPhone&&<p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{initial.guardianPhone}</p>}
                {initial.guardianEmail&&<p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{initial.guardianEmail}</p>}
              </div>
            )}
          </div>
          {(initial.siblingStudying||initial.emergencyContactName)&&(
            <div className="pt-3 border-t border-gray-100 dark:border-zinc-700/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {initial.siblingStudying&&(
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Sibling at School</p>
                  <p className="text-sm text-gray-700 dark:text-zinc-300">{initial.siblingName||"Yes"}</p>
                </div>
              )}
              {initial.emergencyContactName&&(
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Emergency Contact</p>
                  <p className="text-sm text-gray-700 dark:text-zinc-300">{initial.emergencyContactName} · {initial.emergencyContactPhone}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {initial.notes&&(
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5"><div className="flex items-center gap-2 mb-3"><StickyNote className="h-4 w-4 text-primary-500"/><h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Notes</h3></div><p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">{initial.notes}</p></div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <div className="flex items-center gap-2 mb-4"><CalendarDays className="h-4 w-4 text-primary-500"/><h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Timeline</h3></div>
        <ol className="relative ml-2 space-y-4">
          {[
            { date:initial.submittedDate, label:"Application submitted", sub:"Online portal" },
            ...(status!=="pending"?[{ date:initial.updatedAt?.slice(0,10)??initial.submittedDate, label:`Status updated to ${STATUS_LABEL[status]}`, sub:"By admin" }]:[]),
          ].map((ev,i,arr)=>(
            <li key={i} className="relative pl-5">
              {i<arr.length-1 && <span className="absolute left-[5px] top-3 bottom-[-1rem] w-px bg-gray-200 dark:bg-zinc-700"/>}
              <span className="absolute left-0 top-0 flex h-3 w-3 items-center justify-center rounded-full border border-white dark:border-zinc-950 bg-primary-500"/>
              <p className="text-xs font-medium text-gray-800 dark:text-zinc-200">{ev.label}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{formatDate(ev.date)} · {ev.sub}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
    <AdmissionFormPrint app={initial} schoolName={schoolName} schoolLogoUrl={schoolLogoUrl} />
    </>
  );
}

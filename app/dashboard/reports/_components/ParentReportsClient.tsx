"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Award, GraduationCap, TrendingUp, FileText, Send, Loader2 } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { getGrade, gradeStyle, scoreColor, formatDate } from "../../exams/_data/exams";
import { CERT_TYPE_LABEL, STATUS_BADGE, formatDate as formatCertDate, type CertType } from "../../certificates/_data/certificates";
import { requestCertificate } from "../../certificates/actions";

export interface ChildExamGroup {
  examId: string; examName: string; date: string;
  rows: { subject: string; marks: number; max: number; grade: string; isAbsent: boolean }[];
  total: number; maxTotal: number; pct: number;
}

export interface ChildCertificate {
  id: string; certType: CertType; purpose: string; status: keyof typeof STATUS_BADGE;
  requestedOn: string; issuedOn?: string;
}

export interface ChildReportData {
  id: string;
  name: string;
  classLabel: string;
  rollNo: string;
  examGroups: ChildExamGroup[];
  certificates: ChildCertificate[];
}

const CERT_TYPES: CertType[] = ["bonafide", "transfer", "character", "study"];

function RequestCertificateForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [certType, setCertType] = useState<CertType>("bonafide");
  const [purpose, setPurpose] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await requestCertificate(studentId, certType, purpose);
      setPurpose("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 rounded-lg border border-dashed border-gray-200 dark:border-zinc-700 p-3">
      <select
        value={certType}
        onChange={(e) => setCertType(e.target.value as CertType)}
        className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
      >
        {CERT_TYPES.map((t) => <option key={t} value={t}>{CERT_TYPE_LABEL[t]}</option>)}
      </select>
      <input
        type="text"
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        placeholder="Purpose (e.g. scholarship application)"
        required
        className="h-9 flex-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
      />
      <FancyButton
        type="submit"
        disabled={isPending}
        size="sm"
        className="shrink-0"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        Request
      </FancyButton>
    </form>
  );
}

export default function ParentReportsClient({ childrenData }: { childrenData: ChildReportData[] }) {
  const [selectedId, setSelectedId] = useState(childrenData[0]?.id ?? "");
  const child = childrenData.find((c) => c.id === selectedId) ?? childrenData[0];

  if (!child) {
    return (
      <div className="w-full px-6 py-8">
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">No children linked to this account</p>
        </div>
      </div>
    );
  }

  const overallPct = child.examGroups.length
    ? Math.round(child.examGroups.reduce((a, g) => a + g.pct, 0) / child.examGroups.length)
    : 0;

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Report Cards & Certificates</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Published exam results and certificate requests for your children</p>
      </div>

      {childrenData.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {childrenData.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                c.id === child.id
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Exams Published", value: String(child.examGroups.length), icon: GraduationCap, accent: "text-blue-500 bg-blue-500/10" },
          { label: "Overall Average", value: `${overallPct}%`, icon: TrendingUp, accent: "text-emerald-500 bg-emerald-500/10" },
          { label: "Class", value: child.classLabel, icon: Award, accent: "text-violet-500 bg-violet-500/10" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}><s.icon className="h-5 w-5" /></div>
            <div><p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p></div>
          </div>
        ))}
      </div>

      {child.examGroups.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-16 text-center">
          <p className="text-sm text-gray-400 dark:text-zinc-500">No published results yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {child.examGroups.map((g) => (
            <div key={g.examId} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-700/50 px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{g.examName}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{g.date ? formatDate(g.date) : "—"}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${scoreColor(g.pct)}`}>{g.total}/{g.maxTotal} ({g.pct}%)</p>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${gradeStyle(getGrade(g.pct))}`}>{getGrade(g.pct)}</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                {g.rows.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-2.5 text-sm">
                    <span className="text-gray-700 dark:text-zinc-300">{r.subject}</span>
                    <div className="flex items-center gap-3">
                      {r.isAbsent ? (
                        <span className="text-xs text-red-500 dark:text-red-400 font-medium">Absent</span>
                      ) : (
                        <>
                          <span className={`font-semibold ${scoreColor(r.max ? (r.marks / r.max) * 100 : 0)}`}>{r.marks}/{r.max}</span>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${gradeStyle(r.grade)}`}>{r.grade}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary-500" />
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Certificates</p>
        </div>
        <div className="p-5 space-y-4">
          <RequestCertificateForm studentId={child.id} />
          {child.certificates.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-4 text-center">No certificate requests yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {child.certificates.map((c) => {
                const badge = STATUS_BADGE[c.status];
                return (
                  <div key={c.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{CERT_TYPE_LABEL[c.certType]}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{c.purpose} · Requested {formatCertDate(c.requestedOn)}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

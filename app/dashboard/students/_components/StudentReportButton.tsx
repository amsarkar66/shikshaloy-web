"use client";

import { Download } from "lucide-react";
import type { Guardian, ExamRow, FeeRow } from "./StudentDetailTabs";
import { formatAddress, type StructuredAddress } from "@/lib/students/address";

export interface StudentReportData {
  name: string;
  rollNo: string;
  admissionNo: string;
  classLabel: string;
  dob: string;
  gender: string;
  phone: string;
  presentAddress: StructuredAddress;
  permanentAddress: StructuredAddress;
  joinedDate: string;
  overallAtt: number;
  totalPresent: number;
  totalDays: number;
  avgScore: number | null;
  totalFees: number;
  paidFees: number;
  guardians: Guardian[];
  exams: ExamRow[];
  fees: FeeRow[];
}

function esc(v: string | number): string {
  return String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

function printStudentReport(d: StudentReportData) {
  const win = window.open("", "_blank", "width=900,height=750");
  if (!win) return;

  const guardianRows = d.guardians.map((g) => `
    <tr><td>${esc(g.name)}</td><td>${esc(g.relationship)}</td><td>${esc(g.phone)}</td><td>${esc(g.email)}</td></tr>
  `).join("") || `<tr><td colspan="4" class="empty">No parent/guardian linked</td></tr>`;

  const examRows = d.exams.map((e) => `
    <tr>
      <td>${esc(e.subject)}</td><td>${esc(e.examName)}</td>
      <td class="num">${e.isAbsent ? "Absent" : `${e.marks}/${e.max}`}</td>
      <td class="num">${esc(e.grade ?? "—")}</td>
    </tr>
  `).join("") || `<tr><td colspan="4" class="empty">No exam results recorded</td></tr>`;

  const feeRows = d.fees.map((f) => `
    <tr>
      <td>${esc(f.date)}</td><td>${esc(f.description)}</td>
      <td class="num">₹${f.amountDue.toLocaleString("en-IN")}</td>
      <td class="num">₹${f.amountPaid.toLocaleString("en-IN")}</td>
      <td class="cap">${esc(f.status)}</td>
    </tr>
  `).join("") || `<tr><td colspan="5" class="empty">No fee records</td></tr>`;

  win.document.write(`
    <!doctype html><html><head><title>Student Report — ${esc(d.name)}</title>
    <meta charset="utf-8" />
    <style>
      body { font-family: Arial, Helvetica, sans-serif; padding: 28px; color: #111; }
      h1 { font-size: 20px; margin: 0 0 2px; }
      p.sub { font-size: 12px; color: #666; margin: 0 0 20px; }
      h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; color: #444; margin: 22px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
      .stat { border: 1px solid #ddd; border-radius: 6px; padding: 10px; }
      .stat .v { font-size: 16px; font-weight: 700; }
      .stat .l { font-size: 11px; color: #666; }
      dl { display: grid; grid-template-columns: 140px 1fr; gap: 6px 12px; font-size: 12px; margin: 0; }
      dt { color: #666; }
      dd { margin: 0; font-weight: 600; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
      th { background: #f3f4f6; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; color: #555; }
      td.num { text-align: right; white-space: nowrap; }
      td.cap { text-transform: capitalize; }
      td.empty { text-align: center; color: #999; font-style: italic; }
      @media print { body { padding: 0; } }
    </style>
    </head><body>
      <h1>${esc(d.name)}</h1>
      <p class="sub">Roll No. ${esc(d.rollNo)} · Class ${esc(d.classLabel)} · Admission No. ${esc(d.admissionNo)}</p>

      <div class="grid">
        <div class="stat"><div class="v">${d.overallAtt}%</div><div class="l">Attendance (${d.totalPresent}/${d.totalDays} days)</div></div>
        <div class="stat"><div class="v">${d.avgScore !== null ? `${d.avgScore}%` : "—"}</div><div class="l">Average Score (${d.exams.length} results)</div></div>
        <div class="stat"><div class="v">₹${d.paidFees.toLocaleString("en-IN")}</div><div class="l">Fees Paid of ₹${d.totalFees.toLocaleString("en-IN")}</div></div>
        <div class="stat"><div class="v">${esc(d.joinedDate)}</div><div class="l">Enrolled Since</div></div>
      </div>

      <h2>Personal Information</h2>
      <dl>
        <dt>Date of Birth</dt><dd>${esc(d.dob)}</dd>
        <dt>Gender</dt><dd>${esc(d.gender)}</dd>
        <dt>Phone</dt><dd>${esc(d.phone)}</dd>
        <dt>Present Address</dt><dd>${esc(formatAddress(d.presentAddress) || "—")}</dd>
        <dt>Permanent Address</dt><dd>${esc(formatAddress(d.permanentAddress) || "—")}</dd>
      </dl>

      <h2>Parents / Guardians</h2>
      <table>
        <thead><tr><th>Name</th><th>Relationship</th><th>Phone</th><th>Email</th></tr></thead>
        <tbody>${guardianRows}</tbody>
      </table>

      <h2>Exam Results</h2>
      <table>
        <thead><tr><th>Subject</th><th>Exam</th><th>Score</th><th>Grade</th></tr></thead>
        <tbody>${examRows}</tbody>
      </table>

      <h2>Fee History</h2>
      <table>
        <thead><tr><th>Date</th><th>Description</th><th>Due</th><th>Paid</th><th>Status</th></tr></thead>
        <tbody>${feeRows}</tbody>
      </table>
    </body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

export function StudentReportButton({ data }: { data: StudentReportData }) {
  return (
    <button
      onClick={() => printStudentReport(data)}
      className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
    >
      <Download className="h-3.5 w-3.5" /> Report
    </button>
  );
}

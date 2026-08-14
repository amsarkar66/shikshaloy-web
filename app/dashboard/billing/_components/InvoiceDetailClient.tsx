"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Printer, Download, Loader2,
  MapPin, Phone, Mail, Globe, CreditCard,
  CheckCircle2, Clock, XCircle, Receipt, ShieldCheck,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import {
  STATUS_BADGE, STATUS_LABEL, PAYMENT_METHOD_LABEL, formatCurrency, formatDate,
  type InvoiceStatus, type PaymentMethod,
} from "@/app/dashboard/billing/_data/billing";

export interface InvoiceDetail {
  id: string;
  invoiceNo: string;
  period: string;
  plan: string;
  amount: number;
  status: InvoiceStatus;
  issuedDate: string;
  createdAt: string;
  billTo: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
  };
  paymentMethodSummary: string | null;
  paymentMethod?: PaymentMethod | null;
  offlineReference?: string | null;
  offlineReceiptUrl?: string | null;
  verifiedAt?: string | null;
}

const STATUS_ICON: Record<InvoiceStatus, React.ElementType> = {
  paid: CheckCircle2,
  pending: Clock,
  failed: XCircle,
};

function InfoLine({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
      <Icon className="h-3 w-3 shrink-0 text-gray-400 dark:text-zinc-500" />
      {children}
    </p>
  );
}

export default function InvoiceDetailClient({
  invoice, backHref = "/dashboard/invoices", backLabel = "Back to Invoices", autoDownload = false,
}: {
  invoice: InvoiceDetail;
  backHref?: string;
  backLabel?: string;
  autoDownload?: boolean;
}) {
  const [downloading, setDownloading] = useState(false);
  const StatusIcon = STATUS_ICON[invoice.status];
  const autoDownloadTriggered = useRef(false);

  const location = [invoice.billTo.address, invoice.billTo.city, invoice.billTo.state, invoice.billTo.country]
    .filter(Boolean)
    .join(", ");

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const node = document.getElementById("invoice-print-area");
      if (!node) return;

      const canvas = await html2canvas(node, {
        scale: 3,
        backgroundColor: "#ffffff",
        // The invoice PDF should always render in light mode regardless of
        // the viewer's current theme. html2canvas rasterizes a detached
        // clone of the document, so stripping the "dark" class there only
        // affects the capture — the live page never flashes themes.
        onclone: (clonedDoc) => {
          clonedDoc.documentElement.classList.remove("dark");
        },
      });
      const imgData = canvas.toDataURL("image/png");

      const pageWidthMm = 210;
      const pageHeightMm = 297;
      const marginMm = 10;
      const contentWidthMm = pageWidthMm - marginMm * 2;
      const contentHeightMm = (canvas.height * contentWidthMm) / canvas.width;

      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const heightOnPage = Math.min(contentHeightMm, pageHeightMm - marginMm * 2);
      doc.addImage(imgData, "PNG", marginMm, marginMm, contentWidthMm, heightOnPage);
      doc.save(`invoice-${invoice.invoiceNo}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    if (autoDownload && !autoDownloadTriggered.current) {
      autoDownloadTriggered.current = true;
      void handleDownload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownload]);

  return (
    <div className="w-full space-y-4 px-6 py-6 print:px-0 print:py-0">
      <div className="flex items-center gap-3 print:hidden">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <FancyButton onClick={handleDownload} disabled={downloading} size="xs">
            {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {downloading ? "Preparing…" : "Download PDF"}
          </FancyButton>
        </div>
      </div>

      <div
        id="invoice-print-area"
        className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm print:max-w-none print:rounded-none print:border-none print:shadow-none"
      >
        {/* Header */}
        <div className="flex flex-col gap-6 border-b border-gray-100 dark:border-zinc-800 px-8 py-7 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <img src="/logo.svg" alt="" className="h-10 w-10 shrink-0" />
            <div>
              <p className="text-base font-extrabold tracking-tight text-gray-900 dark:text-zinc-50">Shikshaloy Technologies</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">School Management Platform</p>
              <div className="mt-2 space-y-0.5">
                <InfoLine icon={Mail}>support@shikshaloy.com</InfoLine>
                <InfoLine icon={Globe}>www.shikshaloy.com</InfoLine>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-lg font-extrabold uppercase tracking-wide text-gray-900 dark:text-zinc-50">Invoice</p>
            <p className="font-mono text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{invoice.invoiceNo}</p>
            <span className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[invoice.status]}`}>
              <StatusIcon className="h-3 w-3" /> {STATUS_LABEL[invoice.status]}
            </span>
          </div>
        </div>

        {/* Bill to / meta */}
        <div className="grid grid-cols-1 gap-6 border-b border-gray-100 dark:border-zinc-800 px-8 py-6 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">Billed to</p>
            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">{invoice.billTo.name}</p>
            <div className="mt-1.5 space-y-1">
              {location && <InfoLine icon={MapPin}>{location}</InfoLine>}
              {invoice.billTo.phone && <InfoLine icon={Phone}>{invoice.billTo.phone}</InfoLine>}
              {invoice.billTo.email && <InfoLine icon={Mail}>{invoice.billTo.email}</InfoLine>}
              {invoice.billTo.website && <InfoLine icon={Globe}>{invoice.billTo.website.replace(/^https?:\/\//, "")}</InfoLine>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:justify-items-end sm:text-right">
            {[
              { label: "Invoice date", value: formatDate(invoice.issuedDate) },
              { label: "Billing period", value: invoice.period },
              { label: "Plan", value: invoice.plan },
              { label: "Payment method", value: invoice.paymentMethodSummary ?? "—" },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">{f.label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Line items */}
        <div className="px-8 py-6">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-200 dark:border-zinc-700">
                <tr>
                  {["Description", "Billing period", "Amount"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                <tr>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{invoice.plan} Plan — Subscription</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Shikshaloy platform subscription fee</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-zinc-400 whitespace-nowrap">{invoice.period}</td>
                  <td className="px-4 py-3 text-sm font-medium tabular-nums text-gray-800 dark:text-zinc-200">{formatCurrency(invoice.amount)}</td>
                </tr>
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-zinc-800/80 border-t border-gray-200 dark:border-zinc-700">
                <tr>
                  <td colSpan={2} className="px-4 py-2.5 text-right text-sm text-gray-500 dark:text-zinc-400">Subtotal</td>
                  <td className="px-4 py-2.5 text-sm font-medium tabular-nums text-gray-700 dark:text-zinc-300">{formatCurrency(invoice.amount)}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-zinc-100">Total</td>
                  <td className="px-4 py-3 text-base font-extrabold tabular-nums text-gray-900 dark:text-zinc-100">{formatCurrency(invoice.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payment summary */}
        <div className="mx-8 mb-6 rounded-xl bg-gray-50 dark:bg-zinc-800/50 p-5 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              {invoice.status === "paid" ? "Amount paid" : "Amount due"}
            </p>
            <p className={`text-2xl font-extrabold mt-0.5 ${
              invoice.status === "paid" ? "text-emerald-600 dark:text-emerald-400"
              : invoice.status === "failed" ? "text-red-600 dark:text-red-400"
              : "text-amber-600 dark:text-amber-400"
            }`}>
              {formatCurrency(invoice.amount)}
            </p>
          </div>
          {invoice.paymentMethodSummary && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Paid via</p>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-zinc-200 mt-0.5">
                <CreditCard className="h-3.5 w-3.5 text-gray-400" /> {invoice.paymentMethodSummary}
              </p>
            </div>
          )}
          <div className="ml-auto">
            <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-bold ${STATUS_BADGE[invoice.status]}`}>
              <StatusIcon className="h-3.5 w-3.5" /> {STATUS_LABEL[invoice.status].toUpperCase()}
            </span>
          </div>
        </div>

        {/* Offline payment details */}
        {invoice.paymentMethod === "offline" && invoice.offlineReference && (
          <div className="mx-8 mb-6 rounded-xl border border-gray-200 dark:border-zinc-800 p-5 print:hidden">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              <Receipt className="h-3.5 w-3.5" /> Offline payment {PAYMENT_METHOD_LABEL.offline.toLowerCase()}
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Reference</p>
                <p className="font-mono text-sm text-gray-800 dark:text-zinc-200 mt-0.5">{invoice.offlineReference}</p>
              </div>
              {invoice.offlineReceiptUrl && (
                <a
                  href={invoice.offlineReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View uploaded receipt
                </a>
              )}
              {invoice.verifiedAt && (
                <div className="ml-auto flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified {formatDate(invoice.verifiedAt)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-zinc-800 px-8 py-5 text-center">
          <p className="text-xs text-gray-400 dark:text-zinc-600">
            This is a computer-generated invoice and does not require a signature or seal.
          </p>
          <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">
            Questions about this invoice? Contact <span className="text-gray-500 dark:text-zinc-400">support@shikshaloy.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}

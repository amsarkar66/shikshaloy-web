"use client";

import { GraduationCap, IdCard as IdCardIcon, FileText, Calendar, Droplets, Phone } from "lucide-react";
import { avatarColor, initials } from "../../_data/people";
import { useQrCode } from "@/lib/id-cards/use-qr-code";
import { useBarcode } from "@/lib/id-cards/use-barcode";
import type { CardLayoutProps } from "./types";
import { PREVIEW_PX_PER_MM } from "@/lib/id-cards/preview-scale";

function ValidTillBadge({ validTill, mutedText, valueText }: { validTill: string; mutedText: string; valueText: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5 leading-none">
      <span className={`w-full text-center text-[7px] font-medium uppercase tracking-wide ${mutedText}`}>Valid Upto</span>
      <span className={`w-full text-center text-[10px] font-bold ${valueText}`}>{validTill}</span>
    </div>
  );
}

function BarcodeImage({
  dataUrl, value, mutedText, barcodeLabelBg, widthClassName = "max-w-[62%]",
}: { dataUrl: string | null; value: string; mutedText: string; barcodeLabelBg: string; widthClassName?: string }) {
  return (
    <div className={`relative flex h-6 w-full min-w-0 items-center justify-center overflow-hidden ${widthClassName}`}>
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt="Barcode" className="h-full w-full object-fill" />
      ) : (
        <div className="h-full w-full animate-pulse rounded bg-gray-200" />
      )}
      <span className={`absolute inset-x-0 bottom-0 mx-auto w-fit whitespace-nowrap px-0.5 text-[7px] leading-none tracking-widest ${barcodeLabelBg} ${mutedText}`}>
        {value}
      </span>
    </div>
  );
}

function DetailRow({
  icon: Icon, label, value, mutedText, valueText,
}: { icon: React.ElementType; label: string; value: string; mutedText: string; valueText: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[10.5px]">
      <Icon className={`h-3 w-3 shrink-0 ${mutedText}`} />
      <span className={mutedText}>{label}:</span>
      <span className={`truncate font-medium ${valueText}`}>{value}</span>
    </div>
  );
}

export function ClassicCenteredLayout({
  person, template, orientation, widthMm, heightMm, showBarcode, showQr, visibleFields,
  schoolName, schoolLogoUrl, className = "",
}: CardLayoutProps) {
  // Students: QR links to a public, no-login safety page (blood group + emergency
  // contacts) — for bus staff/bystanders/first responders to scan with any camera.
  // Staff aren't a public-safety use case, so their QR just carries identity text.
  const qrValue = person.type === "student"
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${person.id}`
    : `${schoolName} · Staff · ${person.name} · ID ${person.idNumber}`;
  const qrDataUrl = useQrCode(qrValue, showQr);
  const horizontal = orientation === "horizontal";
  const barcodeDataUrl = useBarcode(person.idNumber, showBarcode, horizontal ? 80 : 130);

  return (
    <div
      className={`id-card shrink-0 overflow-hidden rounded-2xl border shadow-sm flex flex-col ${template.cardBorder} ${template.cardBg} ${className}`}
      style={{ width: `${widthMm * PREVIEW_PX_PER_MM}px`, aspectRatio: `${widthMm} / ${heightMm}` }}
    >
      {/* Header */}
      <div className={`relative shrink-0 px-4 pt-4 pb-5 ${template.header}`}>
        <div className="flex items-center gap-2">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ${template.crestBox}`}>
            {schoolLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={schoolLogoUrl} alt={schoolName} className="h-full w-full object-cover" />
            ) : (
              <GraduationCap className={`h-5 w-5 ${template.crestIcon}`} />
            )}
          </div>
          <div className="min-w-0">
            <p className={`truncate text-[13px] font-extrabold uppercase tracking-wide ${template.headerText}`}>{schoolName}</p>
            <p className={`truncate text-[8px] uppercase tracking-widest ${template.headerSubtext}`}>International School</p>
          </div>
        </div>
      </div>

      {/* Body */}
      {horizontal ? (
        <div className="relative flex-1 min-w-0 flex flex-col px-4 pt-4 pb-4">
          <div className="flex items-stretch gap-2.5">
            <div className="flex h-full shrink-0 flex-col items-center">
              <div
                className={`flex w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow ring-2 ${template.photoRing}`}
                style={{ aspectRatio: "35 / 45" }}
              >
                {person.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={person.photoUrl} alt={person.name} className="h-full w-full object-cover" />
                ) : (
                  <div className={`flex h-full w-full items-center justify-center text-base font-bold text-white ${avatarColor(person.id)}`}>
                    {initials(person.name)}
                  </div>
                )}
              </div>
              {showBarcode && (
                <BarcodeImage dataUrl={barcodeDataUrl} value={person.idNumber} mutedText={template.mutedText} barcodeLabelBg={template.barcodeLabelBg} widthClassName="mt-1.5 w-20" />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <p className={`truncate text-[13px] font-bold ${template.nameText}`}>{person.name}</p>
              <span className={`mt-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${template.badge}`}>
                {person.subtitle}
              </span>
              <div className="mt-2 grid grid-cols-1 gap-y-1">
                <DetailRow icon={IdCardIcon} label={person.type === "student" ? "Student ID" : "Staff ID"} value={person.idNumber} mutedText={template.mutedText} valueText={template.valueText} />
                {visibleFields.admissionNo && person.admissionNo && <DetailRow icon={FileText} label="Admission No" value={person.admissionNo} mutedText={template.mutedText} valueText={template.valueText} />}
                {visibleFields.dob && person.dob && <DetailRow icon={Calendar} label="DOB" value={person.dob} mutedText={template.mutedText} valueText={template.valueText} />}
                {visibleFields.bloodGroup && <DetailRow icon={Droplets} label="Blood Group" value={person.bloodGroup} mutedText={template.mutedText} valueText={template.valueText} />}
                {visibleFields.phone && person.phone && <DetailRow icon={Phone} label="Phone" value={person.phone} mutedText={template.mutedText} valueText={template.valueText} />}
              </div>
            </div>
            {showQr && (
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white p-1.5 ${template.cardBorder}`}>
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="QR code" className="h-full w-full" />
                ) : (
                  <div className="h-full w-full animate-pulse rounded bg-gray-100" />
                )}
              </div>
            )}
          </div>

          <div className="absolute bottom-4 right-4">
            <ValidTillBadge validTill={person.validTill} mutedText={template.mutedText} valueText={template.valueText} />
          </div>
        </div>
      ) : (
        <div className="relative flex-1 min-w-0 flex flex-col items-center px-4 pb-4 -mt-4 text-center">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow ring-2 ${template.photoRing}`}>
            {person.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.photoUrl} alt={person.name} className="h-full w-full object-cover" />
            ) : (
              <div className={`flex h-full w-full items-center justify-center text-base font-bold text-white ${avatarColor(person.id)}`}>
                {initials(person.name)}
              </div>
            )}
          </div>
          <span className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${template.badge}`}>
            {person.subtitle}
          </span>
          <p className={`mt-2 w-full truncate text-[14px] font-bold ${template.nameText}`}>{person.name}</p>

          {showQr && (
            <div className={`mt-2 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white p-1.5 ${template.cardBorder}`}>
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR code" className="h-full w-full" />
              ) : (
                <div className="h-full w-full animate-pulse rounded bg-gray-100" />
              )}
            </div>
          )}

          <div className="mt-2.5 flex w-full items-center gap-2">
            <span className={`h-px flex-1 ${template.accent} opacity-40`} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${template.tag}`}>
              {person.type === "student" ? "Student" : "Staff"}
            </span>
            <span className={`h-px flex-1 ${template.accent} opacity-40`} />
          </div>

          <div className="mt-2 grid w-full grid-cols-1 justify-items-center gap-y-1">
            <DetailRow icon={IdCardIcon} label={person.type === "student" ? "Student ID" : "Staff ID"} value={person.idNumber} mutedText={template.mutedText} valueText={template.valueText} />
            {visibleFields.admissionNo && person.admissionNo && <DetailRow icon={FileText} label="Admission No" value={person.admissionNo} mutedText={template.mutedText} valueText={template.valueText} />}
            {visibleFields.dob && person.dob && <DetailRow icon={Calendar} label="DOB" value={person.dob} mutedText={template.mutedText} valueText={template.valueText} />}
            {visibleFields.bloodGroup && <DetailRow icon={Droplets} label="Blood Group" value={person.bloodGroup} mutedText={template.mutedText} valueText={template.valueText} />}
            {visibleFields.phone && person.phone && <DetailRow icon={Phone} label="Phone" value={person.phone} mutedText={template.mutedText} valueText={template.valueText} />}
          </div>

          <div className="mt-auto flex w-full items-center justify-between gap-2 pt-3">
            {showBarcode ? <BarcodeImage dataUrl={barcodeDataUrl} value={person.idNumber} mutedText={template.mutedText} barcodeLabelBg={template.barcodeLabelBg} /> : <span />}
            <ValidTillBadge validTill={person.validTill} mutedText={template.mutedText} valueText={template.valueText} />
          </div>
        </div>
      )}
    </div>
  );
}

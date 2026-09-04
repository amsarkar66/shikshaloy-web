"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Printer, Download, Share2, Star, Info, Users, Briefcase, IdCard as IdCardIcon, MoreHorizontal,
} from "lucide-react";
import type { CardPerson, PersonType } from "../_data/people";
import { IdCard } from "./id-card";
import { TemplateGallery } from "./template-gallery";
import { CardSettingsPanel } from "./card-settings";
import { FieldVisibilityPanel } from "./field-visibility-panel";
import { PersonPickerTable } from "./person-picker-table";
import {
  ID_CARD_TEMPLATES, CARD_SIZES, DEFAULT_ID_CARD_SETTINGS, ID_CARD_SETTINGS_STORAGE_KEY,
  type IdCardSettings,
} from "@/lib/id-cards/templates";
import { PRINT_SCALE } from "@/lib/id-cards/preview-scale";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { FancyButton } from "@/components/ui/fancy-button";

export default function IdCardsClient({
  people, schoolName, schoolLogoUrl,
}: {
  people: CardPerson[];
  schoolName: string;
  schoolLogoUrl: string | null;
}) {
  const searchParams = useSearchParams();
  const [personType, setPersonType] = useState<PersonType>("student");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    const personId = searchParams.get("personId");
    if (!personId) return;
    const person = people.find((p) => p.id === personId);
    if (!person) return;
    setPersonType(person.type);
    setSelected(new Set([person.id]));
    setGenerated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [settings, setSettings] = useState<IdCardSettings>(DEFAULT_ID_CARD_SETTINGS);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ID_CARD_SETTINGS_STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULT_ID_CARD_SETTINGS, ...JSON.parse(raw) });
    } catch {
      // ignore malformed storage
    }
  }, []);

  const peopleOfType = useMemo(() => people.filter((p) => p.type === personType), [people, personType]);
  const activeTemplate = ID_CARD_TEMPLATES.find((t) => t.id === settings.templateId) ?? ID_CARD_TEMPLATES[0];
  const activeCardSize = CARD_SIZES.find((s) => s.id === settings.cardSizeId) ?? CARD_SIZES[0];
  const longSideMm = Math.max(activeCardSize.widthMm, activeCardSize.heightMm);
  const shortSideMm = Math.min(activeCardSize.widthMm, activeCardSize.heightMm);
  const printWidthMm = settings.orientation === "vertical" ? shortSideMm : longSideMm;
  const printHeightMm = settings.orientation === "vertical" ? longSideMm : shortSideMm;

  function toggle(id: string) {
    setGenerated(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function selectMany(ids: string[]) {
    setGenerated(false);
    setSelected((prev) => { const next = new Set(prev); ids.forEach((id) => next.add(id)); return next; });
  }
  function invert(ids: string[]) {
    setGenerated(false);
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (next.has(id) ? next.delete(id) : next.add(id)));
      return next;
    });
  }
  function clearSelection() { setGenerated(false); setSelected(new Set()); }

  const selectedPeople = useMemo(() => people.filter((p) => selected.has(p.id)), [people, selected]);
  const isBulk = selectedPeople.length > 1;

  const [previewFocusId, setPreviewFocusId] = useState<string | null>(null);
  const previewPeople = generated ? selectedPeople : [];
  const samplePerson = previewPeople.find((p) => p.id === previewFocusId) ?? previewPeople[0] ?? null;
  const restPeople = previewPeople.filter((p) => p.id !== samplePerson?.id);
  const thumbs = restPeople.slice(0, 4);
  const moreCount = restPeople.length - thumbs.length;

  function handleGenerate() {
    if (selected.size === 0 || generating) return;
    setGenerating(true);
    setTimeout(() => {
      setPreviewFocusId(null);
      setGenerated(true);
      setGenerating(false);
    }, 500);
  }

  function handlePrint() { window.print(); }

  async function handleDownload() {
    if (previewPeople.length === 0 || downloading) return;
    setDownloading(true);
    setCapturing(true);
    // Let the print-area render off-screen at full size before capturing it.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const printArea = document.getElementById("id-card-print-area");
      const frames = printArea
        ? Array.from(printArea.querySelectorAll<HTMLElement>(".print-card-frame"))
        : [];

      const pageWidthMm = 210;
      const pageHeightMm = 297;
      const marginMm = 10;
      const gapMm = 4;

      const doc = new jsPDF({ unit: "mm", format: "a4" });
      // jsPDF leaves a page's margins/gaps unpainted rather than white, and some
      // PDF viewers render that unpainted space as black instead of white paper —
      // so every page needs an explicit white fill before any card images land on it.
      const paintPageWhite = () => {
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidthMm, pageHeightMm, "F");
      };
      paintPageWhite();
      let x = marginMm;
      let y = marginMm;
      let rowHeight = 0;

      for (const frame of frames) {
        const canvas = await html2canvas(frame, { scale: 3, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL("image/png");

        if (x + printWidthMm > pageWidthMm - marginMm) {
          x = marginMm;
          y += rowHeight + gapMm;
          rowHeight = 0;
        }
        if (y + printHeightMm > pageHeightMm - marginMm) {
          doc.addPage();
          paintPageWhite();
          x = marginMm;
          y = marginMm;
          rowHeight = 0;
        }
        doc.addImage(imgData, "PNG", x, y, printWidthMm, printHeightMm);
        x += printWidthMm + gapMm;
        rowHeight = Math.max(rowHeight, printHeightMm);
      }

      doc.save(`id-cards-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setCapturing(false);
      setDownloading(false);
    }
  }

  async function handleShare() {
    const text = `${previewPeople.length} ID card${previewPeople.length === 1 ? "" : "s"} generated for ${schoolName}`;
    const nav = navigator as Navigator & { share?: (data: { title: string; text: string }) => Promise<void> };
    if (nav.share) {
      try { await nav.share({ title: "ID Cards", text }); } catch { /* user cancelled */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setShareMessage("Summary copied to clipboard");
      setTimeout(() => setShareMessage(null), 2500);
    } catch {
      setShareMessage("Unable to share");
      setTimeout(() => setShareMessage(null), 2500);
    }
  }

  function handleSaveTemplate() {
    localStorage.setItem(ID_CARD_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    setSaveMessage("Template settings saved as default");
    setTimeout(() => setSaveMessage(null), 2500);
  }

  return (
    <div className="w-full px-6 py-6 lg:h-full lg:flex lg:flex-col print:h-auto print:p-0 print:bg-white">
      <div className="print:hidden flex flex-col gap-5 lg:flex-1 lg:min-h-0">
        <div className="shrink-0 space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">ID Cards</h1>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Generate student and staff ID cards</p>
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                  title="More actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={6} className="w-48">
                  <DropdownMenuItem className="cursor-pointer" disabled={previewPeople.length === 0 || downloading} onClick={handleDownload}>
                    <Download className="h-3.5 w-3.5" /> {downloading ? "Generating…" : `Download${previewPeople.length > 1 ? ` (${previewPeople.length})` : ""}`}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" disabled={previewPeople.length === 0} onClick={handleShare}>
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={handleSaveTemplate}>
                    <Star className="h-3.5 w-3.5" /> Save Template
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <FancyButton
                onClick={handlePrint}
                disabled={previewPeople.length === 0}
                size="sm"
              >
                <Printer className="h-3.5 w-3.5" /> Print{previewPeople.length > 1 ? ` (${previewPeople.length})` : ""}
              </FancyButton>
            </div>
          </div>
          {(saveMessage || shareMessage) && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">{saveMessage ?? shareMessage}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr_320px] lg:grid-rows-[minmax(0,1fr)] gap-5 items-stretch lg:flex-1 lg:min-h-0">
          {/* Left column — selection */}
          <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
            <div className="flex shrink-0 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
              {(["student", "staff"] as PersonType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setPersonType(t); setSelected(new Set()); setGenerated(false); }}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
                    personType === t
                      ? "border-b-2 border-primary-500 text-primary-600 dark:text-primary-400"
                      : "text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"
                  }`}
                >
                  {t === "student" ? <Users className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                  {t === "student" ? "Students" : "Staff"}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <PersonPickerTable
                people={peopleOfType}
                type={personType}
                selected={selected}
                onToggle={toggle}
                onSelectMany={selectMany}
                onClear={clearSelection}
                onInvert={invert}
                onGenerate={handleGenerate}
                generating={generating}
              />
            </div>
          </div>

          {/* Middle column — canvas / preview */}
          <div className="flex flex-col rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/40 p-6 min-h-[400px] lg:h-full lg:min-h-0">
            <div className="mb-4 flex shrink-0 items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">
                ID Card Preview {generated && samplePerson && isBulk ? "(Sample)" : ""}
              </p>
              <Info className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>

            <div className="flex flex-1 min-h-0 flex-col items-center justify-center overflow-y-auto">
            {!generated || !samplePerson ? (
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <IdCardIcon className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No cards generated yet</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">
                  Select one {personType} for a single card, or several for a batch — then click Generate.
                </p>
              </div>
            ) : (
              <div className="flex w-full flex-col items-center">
                <div className="flex justify-center overflow-x-auto py-4">
                  <IdCard
                    person={samplePerson}
                    template={activeTemplate}
                    orientation={settings.orientation}
                    layout={settings.layoutId}
                    widthMm={printWidthMm}
                    heightMm={printHeightMm}
                    showBarcode={settings.showBarcode}
                    showQr={settings.showQr}
                    visibleFields={settings.visibleFields}
                    schoolName={schoolName}
                    schoolLogoUrl={schoolLogoUrl}
                  />
                </div>

                {isBulk && restPeople.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap items-stretch justify-center gap-2">
                      {thumbs.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPreviewFocusId(p.id)}
                          title={`Preview ${p.name}`}
                          className="shrink-0 rounded-lg transition-opacity hover:opacity-80"
                        >
                          <IdCard
                            person={p}
                            template={activeTemplate}
                            orientation={settings.orientation}
                            layout={settings.layoutId}
                            widthMm={printWidthMm}
                            heightMm={printHeightMm}
                            showBarcode={settings.showBarcode}
                            showQr={settings.showQr}
                            visibleFields={settings.visibleFields}
                            schoolName={schoolName}
                            schoolLogoUrl={schoolLogoUrl}
                            variant="mini"
                          />
                        </button>
                      ))}
                      {moreCount > 0 && (
                        <div className="flex w-24 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-gray-300 dark:border-zinc-600 px-1.5 text-center text-gray-400 dark:text-zinc-500">
                          <span className="text-sm font-semibold">+{moreCount}</span>
                          <span className="text-[10px] leading-tight">
                            more {personType === "student" ? "student" : "staff member"}{moreCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isBulk && (
                  <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-zinc-500">
                    This is a sample preview. All selected {personType === "student" ? "students" : "staff"} will get ID cards in the same design.
                  </p>
                )}
              </div>
            )}
            </div>
          </div>

          {/* Right column — properties */}
          <div className="space-y-5 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
              <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50">
                {isBulk ? "Batch Settings (Applied to all)" : "ID Card Settings"}
              </p>
              <CardSettingsPanel settings={settings} onChange={setSettings} />
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
              <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50">Fields to Show</p>
              <FieldVisibilityPanel settings={settings} onChange={setSettings} />
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
              <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50">Color Theme</p>
              <TemplateGallery selectedId={settings.templateId} layoutId={settings.layoutId} onSelect={(id) => setSettings((s) => ({ ...s, templateId: id }))} />
            </div>
          </div>
        </div>
      </div>

      {/* Print-only area: full-size cards for every card being generated. Each card
          keeps its full preview-scale design (so nothing re-flows or clips) inside a
          frame sized to the card's true physical dimensions; the print CSS below
          visually shrinks the card down to fit that frame exactly. */}
      <div
        id="id-card-print-area"
        className={
          capturing
            ? "capture-mode fixed left-0 top-0 z-[-1] flex flex-wrap gap-4 bg-white opacity-0"
            : "hidden print:flex print:flex-wrap print:gap-4"
        }
      >
        {previewPeople.map((p) => (
          <div
            key={p.id}
            className="print-card-frame shrink-0 overflow-hidden"
            style={{ width: `${printWidthMm}mm`, height: `${printHeightMm}mm` }}
          >
            <IdCard
              person={p}
              template={activeTemplate}
              orientation={settings.orientation}
              layout={settings.layoutId}
              widthMm={printWidthMm}
              heightMm={printHeightMm}
              showBarcode={settings.showBarcode}
              showQr={settings.showQr}
              visibleFields={settings.visibleFields}
              schoolName={schoolName}
              schoolLogoUrl={schoolLogoUrl}
            />
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          html, body, .dashboard-shell {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page { size: A4; margin: 8mm; }
          .print-card-frame .id-card { transform: scale(${PRINT_SCALE}); transform-origin: top left; }
          /* Push a card that doesn't fully fit on the current page to the next
             one instead of letting the page boundary slice it in half. */
          .print-card-frame { break-inside: avoid; page-break-inside: avoid; }
        }
        /* Mirrors the @media print scaling above so the off-screen PDF capture
           (driven by JS, not an actual print) crops each card to its true
           physical size instead of the larger on-screen preview size. */
        #id-card-print-area.capture-mode .print-card-frame .id-card {
          transform: scale(${PRINT_SCALE});
          transform-origin: top left;
        }
      `}</style>
    </div>
  );
}

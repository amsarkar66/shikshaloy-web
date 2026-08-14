"use client";

import { useEffect, useState } from "react";
import JsBarcode from "jsbarcode";

// Rough CODE128 module-count estimate (start + per-char + checksum + stop),
// used to pick a bar width that keeps the rendered barcode near targetWidthPx
// regardless of how long the ID string is.
function estimateModules(length: number): number {
  return (length + 3) * 11 + 13;
}

export function useBarcode(value: string, enabled: boolean, targetWidthPx = 130): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !value) {
      setDataUrl(null);
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      const barWidth = Math.max(0.75, Math.min(2, targetWidthPx / estimateModules(value.length)));
      JsBarcode(canvas, value, {
        format: "CODE128",
        width: barWidth,
        height: 24,
        margin: 0,
        displayValue: false,
        background: "#ffffff",
        lineColor: "#111827",
      });
      setDataUrl(canvas.toDataURL());
    } catch {
      setDataUrl(null);
    }
  }, [value, enabled, targetWidthPx]);

  return dataUrl;
}

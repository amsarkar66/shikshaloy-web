"use client";

import { useEffect } from "react";
import { OverlayScrollbars } from "overlayscrollbars";
import "overlayscrollbars/overlayscrollbars.css";

export function SmoothScroll() {
  useEffect(() => {
    const instance = OverlayScrollbars(document.body, {
      scrollbars: {
        theme: "os-theme-dark",
        autoHide: "scroll",
        autoHideDelay: 800,
      },
    });

    return () => instance.destroy();
  }, []);

  return null;
}

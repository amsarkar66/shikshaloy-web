"use client";

import { useEffect, useState } from "react";

/** True once mounted on a Mac (macOS/iOS); false during SSR and on every other platform. */
export function useIsMac() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const uaData = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData;
    const platform = uaData?.platform ?? navigator.platform ?? navigator.userAgent;
    setIsMac(/mac|iphone|ipad|ipod/i.test(platform));
  }, []);

  return isMac;
}

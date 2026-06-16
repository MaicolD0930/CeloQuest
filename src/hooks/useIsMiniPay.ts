"use client";

import { useEffect, useState } from "react";
import { isMiniPay } from "@/lib/wallet";

/** Detect MiniPay in-app browser (re-checks after provider injection). */
export function useIsMiniPay() {
  const [miniPay, setMiniPay] = useState(false);

  useEffect(() => {
    const refresh = () => setMiniPay(isMiniPay());
    refresh();
    const timer = window.setTimeout(refresh, 300);
    return () => window.clearTimeout(timer);
  }, []);

  return miniPay;
}

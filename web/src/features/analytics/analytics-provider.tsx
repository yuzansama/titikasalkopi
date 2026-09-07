"use client";

/**
 * Pemuat GA4 tertunda (ADR-12, FR-47).
 *
 * `gtag.js` disuntikkan pada interaksi pertama pengunjung ATAU setelah jendela
 * idle, mana yang lebih dulu, dan tidak pernah sebelum event `load`. Dengan
 * begitu ia tidak pernah bersaing dengan LCP dan tidak masuk hitungan jalur
 * kritis Lighthouse (NFR-01, NFR-03, NFR-04).
 *
 * Seluruh logika muat ada di `@/lib/analytics` milik BE; berkas ini hanya
 * menentukan KAPAN memanggilnya. `loadGtag()` sendiri no-op bila
 * `NEXT_PUBLIC_GA_ID` kosong atau pengunjung memilih keluar.
 */

import { useEffect } from "react";
import { loadGtag } from "@/lib/analytics";

const INTERACTIONS = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
const IDLE_FALLBACK_MS = 4000;

export function AnalyticsProvider() {
  useEffect(() => {
    let done = false;
    let timer: number | null = null;

    const fire = () => {
      if (done) return;
      done = true;
      cleanup();
      loadGtag();
    };

    const cleanup = () => {
      for (const event of INTERACTIONS) {
        window.removeEventListener(event, fire);
      }
      if (timer !== null) window.clearTimeout(timer);
    };

    const arm = () => {
      for (const event of INTERACTIONS) {
        window.addEventListener(event, fire, { once: true, passive: true });
      }
      const idle = (
        window as Window & {
          requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        }
      ).requestIdleCallback;
      if (idle) {
        idle(fire, { timeout: IDLE_FALLBACK_MS });
      } else {
        timer = window.setTimeout(fire, IDLE_FALLBACK_MS);
      }
    };

    if (document.readyState === "complete") {
      arm();
    } else {
      window.addEventListener("load", arm, { once: true });
    }

    return () => {
      done = true;
      cleanup();
      window.removeEventListener("load", arm);
    };
  }, []);

  return null;
}

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MAX_IDLE_MS } from "@/lib/auth/idle-session";

const ACTIVITY_PING_INTERVAL_MS = 60 * 1000;
const IDLE_CHECK_INTERVAL_MS = 15 * 1000;

export default function IdleSessionGuard() {
  const pathname = usePathname();
  const lastActivityRef = useRef(0);
  const lastPingRef = useRef(0);
  const isLoggingOutRef = useRef(false);
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, [pathname]);

  useEffect(() => {
    if (isAuthPage) {
      return;
    }

    const logoutForInactivity = async () => {
      if (isLoggingOutRef.current) {
        return;
      }

      isLoggingOutRef.current = true;

      try {
        await fetch("/api/session/logout", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          keepalive: true,
        });
      } catch {
        // Best effort logout; redirect still clears the client flow.
      }

      const params = new URLSearchParams();
      params.set("error", "Sesi kamu sudah berakhir karena tidak aktif selama 10 menit.");

      if (window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
        params.set("next", `${window.location.pathname}${window.location.search}`);
      }

      window.location.href = `/login?${params.toString()}`;
    };

    const syncActivity = async () => {
      if (isLoggingOutRef.current) {
        return;
      }

      const now = Date.now();
      lastActivityRef.current = now;

      if (now - lastPingRef.current < ACTIVITY_PING_INTERVAL_MS) {
        return;
      }

      lastPingRef.current = now;

      try {
        const response = await fetch("/api/session/activity", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          keepalive: true,
        });

        if (response.status === 401) {
          await logoutForInactivity();
        }
      } catch {
        // Ignore transient network issues; the server still verifies on the next request.
      }
    };

    const handleActivity = () => {
      void syncActivity();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncActivity();
      }
    };

    const intervalId = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= MAX_IDLE_MS) {
        void logoutForInactivity();
      }
    }, IDLE_CHECK_INTERVAL_MS);

    window.addEventListener("pointerdown", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity, { passive: true });
    window.addEventListener("focus", handleActivity);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    void syncActivity();

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("focus", handleActivity);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthPage]);

  return null;
}

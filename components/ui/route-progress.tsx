"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function triggerRouteProgressStart() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("route-progress-start"));
  }
}

export function triggerRouteProgressDone() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("route-progress-done"));
  }
}

/**
 * RouteProgress — top loading bar yang muncul saat navigasi antar halaman atau saat filter/bulan berganti.
 * Murni CSS + React hooks, terhubung ke internal links dan event filter.
 */
export default function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track route changes via pathname + searchParams
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const prevRouteKeyRef = useRef(routeKey);

  useEffect(() => {
    if (prevRouteKeyRef.current !== routeKey) {
      prevRouteKeyRef.current = routeKey;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => setIsVisible(false), 200);
    }
  }, [routeKey]);

  // Listen ke custom events & navigation click
  useEffect(() => {
    const handleStart = () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      setIsVisible(true);
    };

    const handleDone = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => setIsVisible(false), 200);
    };

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Hanya trigger untuk internal links
      const isInternal =
        !href.startsWith("http") &&
        !href.startsWith("//") &&
        !href.startsWith("#") &&
        !href.startsWith("mailto:");

      if (!isInternal) return;

      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsVisible(true), 50);
    };

    document.addEventListener("click", handleClick);
    window.addEventListener("route-progress-start", handleStart);
    window.addEventListener("route-progress-done", handleDone);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("route-progress-start", handleStart);
      window.removeEventListener("route-progress-done", handleDone);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  if (!isVisible) return null;

  return <div className="route-progress-bar" aria-hidden="true" />;
}

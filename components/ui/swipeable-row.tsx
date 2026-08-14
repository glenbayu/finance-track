"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

type SwipeableRowProps = {
  children: ReactNode;
  actions: ReactNode;
  actionWidth?: number;
};

export default function SwipeableRow({
  children,
  actions,
  actionWidth = 140,
}: SwipeableRowProps) {
  const [isSwiped, setIsSwiped] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const isVerticalScroll = useRef(false);
  const swipedRef = useRef(false); // mirror of isSwiped for perf
  const translationRef = useRef(0);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const rafId = useRef(0);

  const applyTransform = useCallback((px: number, animate: boolean) => {
    const el = contentRef.current;
    if (!el) return;
    if (animate) {
      el.style.transition = "transform 280ms cubic-bezier(0.16, 1, 0.3, 1)";
    } else {
      el.style.transition = "none";
    }
    el.style.transform = `translate3d(${px}px, 0, 0)`;
    translationRef.current = px;
  }, []);

  const reset = useCallback(() => {
    applyTransform(0, true);
    swipedRef.current = false;
    setIsSwiped(false);
  }, [applyTransform]);

  // Close swipe when tapping outside the row
  useEffect(() => {
    if (!isSwiped) return;

    const handleGlobalTap = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (rowRef.current && !rowRef.current.contains(target)) {
        reset();
      }
    };

    document.addEventListener("mousedown", handleGlobalTap);
    document.addEventListener("touchstart", handleGlobalTap);
    return () => {
      document.removeEventListener("mousedown", handleGlobalTap);
      document.removeEventListener("touchstart", handleGlobalTap);
    };
  }, [isSwiped, reset]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    isDragging.current = true;
    isVerticalScroll.current = false;

    // Cancel any pending animation frame
    if (rafId.current) cancelAnimationFrame(rafId.current);

    // Remove transition for immediate response
    const el = contentRef.current;
    if (el) el.style.transition = "none";
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const diffX = touch.clientX - startX.current;
    const diffY = touch.clientY - startY.current;

    // Detect vertical scrolling
    if (!isVerticalScroll.current && Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 8) {
      isVerticalScroll.current = true;
      isDragging.current = false;
      applyTransform(swipedRef.current ? -actionWidth : 0, true);
      return;
    }

    if (isVerticalScroll.current) return;

    // Prevent vertical window scroll when swiping horizontally
    if (Math.abs(diffX) > 10 && e.cancelable) {
      e.preventDefault();
    }

    let target = swipedRef.current ? -actionWidth + diffX : diffX;

    // Swipe restrictions: left only, with dampening
    if (target > 0) target = 0;
    if (target < -actionWidth) {
      const excess = target + actionWidth;
      target = -actionWidth + excess * 0.25;
    }

    // Use requestAnimationFrame for buttery smooth updates
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const el = contentRef.current;
      if (el) {
        el.style.transform = `translate3d(${target}px, 0, 0)`;
      }
      translationRef.current = target;
    });
  };

  const handleTouchEnd = () => {
    if (isVerticalScroll.current) return;
    isDragging.current = false;

    if (rafId.current) cancelAnimationFrame(rafId.current);

    // Snapping logic
    const threshold = -actionWidth / 2.5;
    if (translationRef.current < threshold) {
      applyTransform(-actionWidth, true);
      swipedRef.current = true;
      setIsSwiped(true);
    } else {
      applyTransform(0, true);
      swipedRef.current = false;
      setIsSwiped(false);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl w-full select-none"
      ref={rowRef}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* Background layer: action buttons panel */}
      <div
        className="absolute inset-y-0 right-0 flex items-stretch justify-end"
        style={{ width: `${actionWidth}px` }}
      >
        {actions}
      </div>

      {/* Foreground layer: Swipeable card content — GPU-accelerated */}
      <div
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={isSwiped ? reset : undefined}
        className="relative z-10 w-full"
        style={{
          transform: "translate3d(0, 0, 0)",
          willChange: "transform",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

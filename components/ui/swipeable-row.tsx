"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

type SwipeableRowProps = {
  children: ReactNode;
  actions: ReactNode;
  actionWidth?: number;
  className?: string;
};

export default function SwipeableRow({
  children,
  actions,
  actionWidth = 140,
  className = "rounded-xl",
}: SwipeableRowProps) {
  const [isSwiped, setIsSwiped] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const isVerticalScroll = useRef(false);
  const swipedRef = useRef(false);
  const translationRef = useRef(0);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const rafId = useRef(0);

  const applyTransform = useCallback((px: number, animate: boolean) => {
    const el = contentRef.current;
    if (!el) return;
    if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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

    document.addEventListener("pointerdown", handleGlobalTap);
    return () => {
      document.removeEventListener("pointerdown", handleGlobalTap);
    };
  }, [isSwiped, reset]);

  const onStart = (clientX: number, clientY: number) => {
    startX.current = clientX;
    startY.current = clientY;
    isDragging.current = true;
    hasMoved.current = false;
    isVerticalScroll.current = false;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    const el = contentRef.current;
    if (el) el.style.transition = "none";
  };

  const onMove = (clientX: number, clientY: number, e?: React.UIEvent) => {
    if (!isDragging.current) return;

    const diffX = clientX - startX.current;
    const diffY = clientY - startY.current;

    // Detect if this gesture is vertical scrolling
    if (!isVerticalScroll.current && !hasMoved.current) {
      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 6) {
        isVerticalScroll.current = true;
        isDragging.current = false;
        applyTransform(swipedRef.current ? -actionWidth : 0, true);
        return;
      }
      if (Math.abs(diffX) > 6) {
        hasMoved.current = true;
      }
    }

    if (isVerticalScroll.current) return;

    let target = swipedRef.current ? -actionWidth + diffX : diffX;

    // Resistance when pulling right past 0
    if (target > 0) {
      target = target * 0.2;
    }
    // Resistance when pulling left past actionWidth
    if (target < -actionWidth) {
      const excess = target + actionWidth;
      target = -actionWidth + excess * 0.25;
    }

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const el = contentRef.current;
      if (el) {
        el.style.transform = `translate3d(${target}px, 0, 0)`;
      }
      translationRef.current = target;
    });
  };

  const onEnd = () => {
    if (!isDragging.current && !hasMoved.current) return;
    isDragging.current = false;

    if (rafId.current) cancelAnimationFrame(rafId.current);

    const threshold = -actionWidth / 3;
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
      className={`relative overflow-hidden w-full select-none ${className}`}
      ref={rowRef}
      style={{ touchAction: "pan-y" }}
      onKeyDown={(event) => { if (event.key === "Escape") reset(); }}
    >
      {/* Background layer: action buttons panel */}
      <div
        className="absolute inset-y-0 right-0 flex items-stretch justify-end"
        style={{ width: `${actionWidth}px` }}
        inert={!isSwiped}
        aria-hidden={!isSwiped}
      >
        {actions}
      </div>

      {/* Foreground layer: Swipeable card content */}
      <div
        ref={contentRef}
        onPointerDown={(e) => {
          onStart(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          onMove(e.clientX, e.clientY, e);
        }}
        onPointerUp={(e) => {
          onEnd();
        }}
        onPointerCancel={() => {
          onEnd();
        }}
        onClickCapture={(e) => {
          // If the user swiped/dragged, prevent triggering click navigation on inner link
          if (hasMoved.current) {
            e.preventDefault();
            e.stopPropagation();
            hasMoved.current = false;
          } else if (isSwiped) {
            e.preventDefault();
            e.stopPropagation();
            reset();
          }
        }}
        className="relative z-10 w-full bg-[var(--lk-surface)]"
        style={{
          transform: "translate3d(0, 0, 0)",
          willChange: "transform",
          touchAction: "pan-y",
          cursor: "grab",
        }}
      >
        {children}
      </div>
    </div>
  );
}

"use client";

import { useRef, useState, useEffect } from "react";
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
  const [translation, setTranslation] = useState(0);
  const [isSwiped, setIsSwiped] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);
  const isVerticalScroll = useRef(false);
  const rowRef = useRef<HTMLDivElement | null>(null);

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
  }, [isSwiped]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    currentX.current = touch.clientX;
    isDragging.current = true;
    isVerticalScroll.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const diffX = touch.clientX - startX.current;
    const diffY = touch.clientY - startY.current;

    // Detect if user is scrolling vertically rather than swiping horizontally
    if (!isVerticalScroll.current && Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 8) {
      isVerticalScroll.current = true;
      isDragging.current = false;
      setTranslation(isSwiped ? -actionWidth : 0);
      return;
    }

    if (isVerticalScroll.current) return;

    // Prevent vertical window scroll when swiping horizontally
    if (Math.abs(diffX) > 10) {
      if (e.cancelable) e.preventDefault();
    }

    currentX.current = touch.clientX;
    let target = isSwiped ? -actionWidth + diffX : diffX;

    // Swipe restrictions: swipe-left only, with resistance if dragged too far
    if (target > 0) target = 0;
    if (target < -actionWidth) {
      const excess = target + actionWidth;
      target = -actionWidth + excess * 0.25; // dampening effect
    }

    setTranslation(target);
  };

  const handleTouchEnd = () => {
    if (isVerticalScroll.current) return;
    isDragging.current = false;
    
    // Snapping logic based on threshold
    const threshold = -actionWidth / 2.5;
    if (translation < threshold) {
      setTranslation(-actionWidth);
      setIsSwiped(true);
    } else {
      setTranslation(0);
      setIsSwiped(false);
    }
  };

  const reset = () => {
    setTranslation(0);
    setIsSwiped(false);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl w-full select-none" ref={rowRef}>
      {/* Background layer: Hidden actions */}
      <div 
        className="absolute inset-y-0 right-0 flex items-center justify-end px-3 gap-2 bg-slate-100/50 dark:bg-slate-900/35 border-l border-[color:var(--stroke)]"
        style={{ width: `${actionWidth}px` }}
      >
        {actions}
      </div>

      {/* Foreground layer: Swipeable content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={isSwiped ? reset : undefined}
        style={{
          transform: `translate3d(${translation}px, 0, 0)`,
          transition: isDragging.current ? "none" : "transform 280ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="relative z-10 w-full bg-[color:var(--surface)] transition-shadow duration-300"
      >
        {children}
      </div>
    </div>
  );
}

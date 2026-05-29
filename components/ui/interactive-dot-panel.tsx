"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";

type InteractiveDotPanelProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onMouseMove?: MouseEventHandler<HTMLDivElement>;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: MouseEventHandler<HTMLDivElement>;
};

export default function InteractiveDotPanel({
  children,
  className = "",
  style,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
}: InteractiveDotPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const applyPendingPoint = () => {
    rafRef.current = null;
    const panel = panelRef.current;
    const pendingPoint = pendingPointRef.current;
    if (!panel || !pendingPoint) return;

    panel.style.setProperty("--mx", `${pendingPoint.x}px`);
    panel.style.setProperty("--my", `${pendingPoint.y}px`);
    panel.style.setProperty("--dot-opacity", "1");
  };

  const handleMouseMove: MouseEventHandler<HTMLDivElement> = (event) => {
    const panel = panelRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    pendingPointRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    if (rafRef.current === null) {
      rafRef.current = window.requestAnimationFrame(applyPendingPoint);
    }

    onMouseMove?.(event);
  };

  const handleMouseEnter: MouseEventHandler<HTMLDivElement> = (event) => {
    panelRef.current?.style.setProperty("--dot-opacity", "1");
    onMouseEnter?.(event);
  };

  const handleMouseLeave: MouseEventHandler<HTMLDivElement> = (event) => {
    panelRef.current?.style.setProperty("--dot-opacity", "0");
    onMouseLeave?.(event);
  };

  const mergedStyle = {
    ...style,
    "--mx": "50%",
    "--my": "50%",
    "--dot-opacity": 0,
  } as CSSProperties;

  return (
    <div
      ref={panelRef}
      style={mergedStyle}
      className={`interactive-dot-panel ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}


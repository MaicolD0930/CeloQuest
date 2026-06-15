"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type AchievementBadgeModalProps = {
  src: string;
  alt: string;
  title: string;
  description?: string;
  closeLabel: string;
  dragHint: string;
  onClose: () => void;
};

export function AchievementBadgeModal({
  src,
  alt,
  title,
  description,
  closeLabel,
  dragHint,
  onClose,
}: AchievementBadgeModalProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [handleClose]);

  const handleDown = (e: React.PointerEvent) => {
    setDragging(true);
    startRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!dragging || !startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    const max = 25;
    setTilt({
      x: Math.max(-max, Math.min(max, -dy / 4)),
      y: Math.max(-max, Math.min(max, dx / 4)),
    });
  };

  const handleUp = (e: React.PointerEvent) => {
    setDragging(false);
    startRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    setTilt({ x: 0, y: 0 });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex animate-fade-in items-center justify-center bg-h-background/90 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={handleClose}
    >
      <div
        className="relative max-h-[90vh] max-w-[min(100%,28rem)] rounded-3xl bg-surface p-5 ring-1 ring-h-border card-depth-sm"
        style={{ perspective: "1000px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label={closeLabel}
          onClick={handleClose}
          className="absolute -right-2 -top-2 z-10 grid size-9 place-items-center rounded-full border border-h-border bg-h-background shadow-lg transition-colors hover:bg-surface-2"
        >
          <X className="size-5 text-h-foreground" />
        </button>

        <div className="mb-4 text-center">
          <p className="font-display text-lg font-bold text-h-foreground">{title}</p>
          {description && (
            <p className="mt-1 text-xs text-h-muted">{description}</p>
          )}
        </div>

        <div
          className="touch-none select-none cursor-grab active:cursor-grabbing"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: dragging
              ? "none"
              : "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="pointer-events-none mx-auto h-auto w-full max-w-[min(80vw,22rem)] drop-shadow-[0_25px_40px_rgba(0,0,0,0.55)]"
            style={{ transform: "translateZ(40px)" }}
          />
        </div>

        <p className="mt-4 text-center text-[11px] font-medium text-h-muted">
          {dragHint}
        </p>
      </div>
    </div>,
    document.body
  );
}

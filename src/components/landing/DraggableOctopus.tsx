"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { OctopusMascot } from "@/components/landing/OctopusMascot";

type DraggableOctopusProps = {
  /** Optional PNG/WebP mascot (e.g. from Perfil/Lovable assets). Falls back to SVG. */
  imageSrc?: string;
  imageAlt?: string;
  children?: ReactNode;
  className?: string;
};

export function DraggableOctopus({
  imageSrc,
  imageAlt = "CeloQuest mascot",
  children,
  className = "",
}: DraggableOctopusProps) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, ox: 0, oy: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef({
    active: false,
    startX: 0,
    startY: 0,
  });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      if (!drag.current.active) {
        setTilt((t) => {
          const nx = t.rx * 0.86;
          const ny = t.ry * 0.86;
          const ox = t.ox * 0.86;
          const oy = t.oy * 0.86;
          if (
            Math.abs(nx) < 0.05 &&
            Math.abs(ny) < 0.05 &&
            Math.abs(ox) < 0.05 &&
            Math.abs(oy) < 0.05
          ) {
            return { rx: 0, ry: 0, ox: 0, oy: 0 };
          }
          return { rx: nx, ry: ny, ox, oy };
        });
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
    };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;

    const soften = (v: number, max: number) => Math.tanh(v / max) * max;

    const maxTilt = 18;
    const maxOffset = 14;

    setTilt({
      ry: soften(dx, 140) * (maxTilt / 140),
      rx: -soften(dy, 140) * (maxTilt / 140),
      ox: soften(dx, 140) * (maxOffset / 140),
      oy: soften(dy, 140) * (maxOffset / 140),
    });
  };

  const endDrag = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
  };

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ perspective: "900px", touchAction: "none" }}
    >
      <div
        aria-hidden
        className="absolute h-56 w-56 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.65 0.12 85 / 0.55), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute bottom-0 h-5 w-44 rounded-full blur-md"
        style={{
          background: "radial-gradient(ellipse, rgba(0,0,0,0.45), transparent 70%)",
          transform: `translateY(112px) translateX(${tilt.ox * 0.6}px)`,
          transition: "transform 0.25s ease-out",
        }}
      />
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`relative will-change-transform ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{
          transform: `translate3d(${tilt.ox}px, ${tilt.oy}px, 0) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: "preserve-3d",
          transition: dragging
            ? "transform 0.12s ease-out"
            : "transform 0.45s cubic-bezier(.2,.9,.3,1.2)",
        }}
      >
        <div
          className="pointer-events-none"
          style={{
            animation: dragging ? "none" : "octofloat 5s ease-in-out infinite",
          }}
        >
          {children ??
            (imageSrc ? (
              <Image
                src={imageSrc}
                alt={imageAlt}
                width={256}
                height={256}
                draggable={false}
                priority
                className="h-44 w-44 drop-shadow-2xl sm:h-56 sm:w-56"
              />
            ) : (
              <OctopusMascot
                width={224}
                height={238}
                className="h-44 w-auto drop-shadow-[0_15px_35px_oklch(0.9_0.18_100/0.35)] sm:h-56"
              />
            ))}
        </div>
      </div>
    </div>
  );
}

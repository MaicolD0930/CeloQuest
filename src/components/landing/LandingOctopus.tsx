import { OctopusMascot } from "@/components/landing/OctopusMascot";

export function LandingOctopus() {
  return (
    <div className="relative animate-card-pop">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 animate-landing-pulse-glow rounded-full bg-lemon/25 blur-2xl"
      />
      <OctopusMascot
        className="animate-float drop-shadow-[0_15px_35px_oklch(0.9_0.18_100/0.35)]"
      />
    </div>
  );
}

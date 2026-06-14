import { LandingOctopus } from "@/components/landing/LandingOctopus";

type LoadingOctopusProps = {
  label?: string;
  className?: string;
};

export function LoadingOctopus({ label, className = "" }: LoadingOctopusProps) {
  return (
    <div className={`flex flex-col items-center ${className}`.trim()}>
      <LandingOctopus />
      {label ? (
        <p className="mt-6 animate-card-pop font-display text-lg font-semibold text-h-muted">
          {label}
        </p>
      ) : null}
    </div>
  );
}

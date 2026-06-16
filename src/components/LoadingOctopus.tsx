import Image from "next/image";

type LoadingOctopusProps = {
  label?: string;
  className?: string;
};

export function LoadingOctopus({ label, className = "" }: LoadingOctopusProps) {
  return (
    <div className={`flex flex-col items-center ${className}`.trim()}>
      <div className="relative animate-float">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 animate-landing-pulse-glow rounded-full bg-lemon/25 blur-2xl"
        />
        <Image
          src="/images/octopus.png"
          alt=""
          width={176}
          height={176}
          priority
          className="h-44 w-44 drop-shadow-2xl"
        />
      </div>
      {label ? (
        <p className="mt-6 animate-card-pop font-display text-lg font-semibold text-h-muted">
          {label}
        </p>
      ) : null}
    </div>
  );
}

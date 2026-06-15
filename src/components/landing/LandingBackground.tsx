export function LandingBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% -10%, oklch(0.22 0.03 250), oklch(0.12 0.02 260) 60%, oklch(0.08 0.01 270))",
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, oklch(0.65 0.1 85 / 0.15), transparent 40%), radial-gradient(circle at 80% 20%, oklch(0.5 0.12 140 / 0.12), transparent 40%)",
        }}
      />
      <div className="absolute -top-32 -left-24 h-96 w-96 animate-landing-blob rounded-full bg-prosperity/20 blur-3xl" />
      <div
        className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] animate-landing-blob rounded-full bg-lemon/10 blur-3xl"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="absolute bottom-0 left-1/4 h-80 w-80 animate-landing-blob rounded-full bg-prosperity/10 blur-3xl"
        style={{ animationDelay: "6s" }}
      />
    </div>
  );
}

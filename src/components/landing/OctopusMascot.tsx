const TENTACLES = [
  { d: "M40 95 C 22 110, 18 130, 26 148", suckers: [[28, 118], [24, 135], [26, 146]] },
  { d: "M50 100 C 40 122, 40 142, 46 158", suckers: [[46, 122], [42, 140], [46, 156]] },
  { d: "M60 102 C 58 125, 58 145, 60 162", suckers: [[59, 125], [59, 145], [60, 160]] },
  { d: "M70 102 C 72 125, 72 145, 70 162", suckers: [[71, 125], [71, 145], [70, 160]] },
  { d: "M80 100 C 90 122, 90 142, 84 158", suckers: [[84, 122], [88, 140], [84, 156]] },
  { d: "M90 95 C 108 110, 112 130, 104 148", suckers: [[102, 118], [106, 135], [104, 146]] },
  { d: "M34 88 C 12 96, 4 116, 10 138", suckers: [[14, 108], [8, 125], [10, 136]] },
  { d: "M96 88 C 118 96, 126 116, 120 138", suckers: [[116, 108], [122, 125], [120, 136]] },
];

type OctopusMascotProps = {
  className?: string;
  width?: number;
  height?: number;
};

export function OctopusMascot({
  className = "",
  width = 160,
  height = 170,
}: OctopusMascotProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 130 170"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <radialGradient id="octoBodyGrad" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0%" stopColor="#FFF59D" />
          <stop offset="55%" stopColor="#FCFF52" />
          <stop offset="100%" stopColor="#E6C200" />
        </radialGradient>
        <radialGradient id="octoCheekGrad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FF8A65" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FF8A65" stopOpacity="0" />
        </radialGradient>
      </defs>

      {TENTACLES.map((t, i) => (
        <g key={i}>
          <path
            d={t.d}
            stroke="#FCFF52"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
          />
          {t.suckers.map(([cx, cy], j) => (
            <circle
              key={j}
              cx={cx}
              cy={cy}
              r="3.2"
              fill="oklch(0.74 0.18 150)"
              stroke="oklch(0.5 0.13 152)"
              strokeWidth="1"
            />
          ))}
        </g>
      ))}

      <ellipse
        cx="65"
        cy="70"
        rx="48"
        ry="44"
        fill="url(#octoBodyGrad)"
        stroke="#1A1A1A"
        strokeWidth="3"
      />
      <ellipse cx="38" cy="80" rx="9" ry="6" fill="url(#octoCheekGrad)" />
      <ellipse cx="92" cy="80" rx="9" ry="6" fill="url(#octoCheekGrad)" />
      <ellipse cx="50" cy="62" rx="11" ry="13" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
      <ellipse cx="80" cy="62" rx="11" ry="13" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2.5" />
      <circle cx="51" cy="64" r="5.5" fill="#1A1A1A" />
      <circle cx="81" cy="64" r="5.5" fill="#1A1A1A" />
      <circle cx="53" cy="62" r="1.8" fill="#FFFFFF" />
      <circle cx="83" cy="62" r="1.8" fill="#FFFFFF" />
      <circle cx="49" cy="66" r="1" fill="#FFFFFF" />
      <circle cx="79" cy="66" r="1" fill="#FFFFFF" />
      <path
        d="M58 82 Q 65 90 72 82"
        stroke="#1A1A1A"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="50" cy="40" rx="14" ry="6" fill="#FFFFFF" opacity="0.35" />
    </svg>
  );
}

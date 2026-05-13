export function Sparkline({
  color = "oklch(0.30 0.04 60)",
  width = 56,
  height = 24,
}: {
  color?: string;
  width?: number;
  height?: number;
}) {
  return (
    <svg width={width} height={height} viewBox="0 0 56 24" fill="none" aria-hidden>
      <path
        d="M2 18 L10 14 L18 16 L26 9 L34 12 L42 5 L54 8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="54" cy="8" r="2.2" fill={color} />
    </svg>
  );
}

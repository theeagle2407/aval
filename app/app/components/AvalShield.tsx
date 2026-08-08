/**
 * Inline recreation of the AVAL shield mark (app-assets/aval_logo.png), traced from the
 * source artwork's exact geometry so it matches closely at any size with a transparent
 * background - no baked-in canvas square, so it blends into any surface (page, corner, nav).
 */
export function AvalShield({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AVAL"
      role="img"
    >
      <path
        d="M50 22.8 L76.5 29.3 L76.5 49 L50 81.7 L23.5 49 L23.5 29.3 Z"
        fill="#1A263E"
        stroke="#0F2930"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M50 22.8 L76.5 29.3 L76.5 49 L50 81.7 L23.5 49 L23.5 29.3 Z"
        fill="none"
        stroke="#676E7C"
        strokeWidth="0.5"
        strokeOpacity="0.6"
        strokeLinejoin="round"
        transform="translate(50 52) scale(0.965) translate(-50 -52)"
      />

      <circle cx="50" cy="34" r="7.2" fill="#F3F3EC" stroke="#2DD4BF" strokeWidth="1.4" />
      <path
        d="M46.3 34.2 L48.8 37.3 L54.2 29"
        stroke="#12796F"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      <rect x="39.3" y="41" width="21.3" height="4.9" rx="1.6" fill="#2DD4BF" />
      <rect x="33.8" y="47.4" width="32.6" height="5.8" rx="1.8" fill="#7896B9" />
      <rect x="27.7" y="55" width="44.5" height="5.5" rx="1.8" fill="#4A5C80" />
    </svg>
  );
}

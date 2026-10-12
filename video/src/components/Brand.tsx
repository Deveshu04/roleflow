import type React from "react";
import { colors, fonts } from "../theme";

export const LogoMark: React.FC<{ size: number; color?: string }> = ({ size, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
    <g transform="rotate(-30 12 12)">
      <circle cx="7.3" cy="3.2" r="1.45" />
      <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
      <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
      <circle cx="16.7" cy="20.8" r="1.45" />
    </g>
  </svg>
);

// The app header lockup: white mark on an ink tile.
export const AppLogo: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: fonts.sans, ...style }}>
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        background: colors.ink,
        color: "#fff",
        display: "grid",
        placeItems: "center",
      }}
    >
      <LogoMark size={28} />
    </div>
    <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.03em", color: colors.ink }}>Roleflow</span>
  </div>
);

// The landing page lockup: bare white mark on black.
export const DarkLogo: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#fff", fontFamily: fonts.sans, ...style }}>
    <LogoMark size={34} />
    <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em" }}>Roleflow</span>
  </div>
);

export const GitHubMark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);

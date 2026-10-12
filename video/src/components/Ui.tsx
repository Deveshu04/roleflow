import type { LucideIcon } from "lucide-react";
import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { colors, fonts, progress } from "../theme";
import { AppLogo } from "./Brand";
import { FadeUp, Reveal } from "./Text";

// Layout shared by the light, in-app scenes: eyebrow + headline on top, the stage below.
export const ProductScene: React.FC<{ eyebrow: string; title: React.ReactNode; children: React.ReactNode }> = ({
  eyebrow,
  title,
  children,
}) => (
  <AbsoluteFill style={{ background: colors.paper, fontFamily: fonts.sans, color: colors.ink }}>
    <div style={{ position: "absolute", left: 120, top: 84, right: 120 }}>
      <FadeUp at={0} distance={14}>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: colors.accent }}>
          {eyebrow}
        </div>
      </FadeUp>
      <div style={{ marginTop: 16, fontSize: 70, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.05 }}>
        <Reveal at={4}>{title}</Reveal>
      </div>
    </div>
    <FadeUp at={6} distance={0} style={{ position: "absolute", right: 120, top: 84 }}>
      <AppLogo />
    </FadeUp>
    {children}
  </AbsoluteFill>
);

export const Window: React.FC<{
  url?: string;
  live?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ url, live, style, children }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        background: "#fff",
        borderRadius: 22,
        border: `1px solid ${colors.line}`,
        boxShadow: "0 40px 90px rgba(29, 29, 27, 0.14), 0 8px 24px rgba(29, 29, 27, 0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      <div
        style={{
          flex: "none",
          height: 50,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 20px",
          background: "#fbfbf9",
          borderBottom: `1px solid ${colors.line}`,
        }}
      >
        <div style={{ display: "flex", gap: 9 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 13, height: 13, borderRadius: 99, background: "#dedcd5" }} />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            height: 32,
            borderRadius: 9,
            background: "#f1f0eb",
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            fontSize: 19,
            color: colors.muted,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {url}
        </div>
        {live && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 19, fontWeight: 600, color: colors.accent }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 99,
                background: colors.accent,
                opacity: 0.55 + 0.45 * Math.cos(frame / 9),
              }}
            />
            Live view
          </div>
        )}
      </div>
      <div style={{ position: "relative", flex: 1 }}>{children}</div>
    </div>
  );
};

export const Chip: React.FC<{ icon: LucideIcon; tone?: "accent" | "warn"; children: React.ReactNode; style?: React.CSSProperties }> = ({
  icon: Icon,
  tone = "accent",
  children,
  style,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 16,
      padding: "14px 30px 14px 14px",
      background: "#fff",
      border: `1px solid ${colors.line}`,
      borderRadius: 999,
      boxShadow: "0 18px 40px rgba(29, 29, 27, 0.14)",
      fontSize: 32,
      fontWeight: 500,
      letterSpacing: "-0.015em",
      color: colors.ink,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    <span
      style={{
        width: 48,
        height: 48,
        borderRadius: 99,
        display: "grid",
        placeItems: "center",
        background: tone === "warn" ? colors.warnSoft : colors.soft,
        color: tone === "warn" ? colors.warn : colors.accent,
      }}
    >
      <Icon size={26} strokeWidth={2.2} />
    </span>
    {children}
  </div>
);

// A chip that pops in at `at` and leaves at `until`; `style` positions its wrapper.
export const TimedChip: React.FC<React.ComponentProps<typeof Chip> & { at: number; until?: number }> = ({
  at,
  until = Infinity,
  style,
  ...chip
}) => {
  const frame = useCurrentFrame();
  const t = progress(frame, at, 20) * (1 - progress(frame, until, 12));
  return (
    <div style={style}>
      <Chip {...chip} style={{ opacity: t, translate: `0 ${(1 - t) * 18}px`, scale: String(0.96 + 0.04 * t) }} />
    </div>
  );
};

export const centered: React.CSSProperties = { position: "absolute", left: 0, right: 0, display: "flex", justifyContent: "center" };

export const Point: React.FC<{ icon: LucideIcon; at: number; active?: boolean; title: string; sub?: string }> = ({
  icon: Icon,
  at,
  active = true,
  title,
  sub,
}) => (
  <FadeUp at={at} distance={20}>
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start", opacity: active ? 1 : 0.4 }}>
      <span
        style={{
          flex: "none",
          width: 64,
          height: 64,
          borderRadius: 20,
          display: "grid",
          placeItems: "center",
          background: colors.soft,
          color: colors.accent,
        }}
      >
        <Icon size={32} strokeWidth={2} />
      </span>
      <div style={{ paddingTop: 8 }}>
        <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.2 }}>{title}</div>
        {sub && <div style={{ marginTop: 8, fontSize: 30, color: colors.muted, lineHeight: 1.3 }}>{sub}</div>}
      </div>
    </div>
  </FadeUp>
);

export const Cursor: React.FC<{ x: number; y: number; size?: number; press?: number; style?: React.CSSProperties }> = ({
  x,
  y,
  size = 44,
  press = 0,
  style,
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: size, height: size, pointerEvents: "none", ...style }}>
    {press > 0 && (
      <div
        style={{
          position: "absolute",
          left: -size * 0.6,
          top: -size * 0.6,
          width: size * 1.2,
          height: size * 1.2,
          borderRadius: 999,
          border: `3px solid ${colors.accent}`,
          opacity: 1 - press,
          scale: String(0.4 + press * 0.9),
        }}
      />
    )}
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))" }}>
      <path d="M4 2.5 19.5 12l-7 1.6L9.2 20.6Z" fill={colors.ink} stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  </div>
);

export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => (
  <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
    <svg width="100%" height="100%" preserveAspectRatio="none">
      <filter id="grain-noise" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-noise)" />
    </svg>
  </AbsoluteFill>
);

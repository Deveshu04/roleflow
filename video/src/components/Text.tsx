import type React from "react";
import { useCurrentFrame } from "remotion";
import { fonts, progress } from "../theme";

export const Accent: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <em
    style={{
      fontFamily: fonts.serif,
      fontStyle: "italic",
      fontWeight: 400,
      fontSize: "1.1em",
      letterSpacing: "-0.02em",
      color,
    }}
  >
    {children}
  </em>
);

// A line that rises out of a mask, like the landing page headline.
export const Reveal: React.FC<{ at: number; duration?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  at,
  duration = 30,
  children,
  style,
}) => {
  const t = progress(useCurrentFrame(), at, duration);
  return (
    <span style={{ display: "block", overflow: "hidden", padding: "0.06em 0.12em 0.16em", margin: "-0.06em -0.12em -0.16em", ...style }}>
      <span style={{ display: "block", translate: `0 ${(1 - t) * 55}%`, opacity: t }}>{children}</span>
    </span>
  );
};

export const FadeUp: React.FC<{
  at: number;
  duration?: number;
  distance?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ at, duration = 24, distance = 24, children, style }) => {
  const t = progress(useCurrentFrame(), at, duration);
  return <div style={{ opacity: t, translate: `0 ${(1 - t) * distance}px`, ...style }}>{children}</div>;
};

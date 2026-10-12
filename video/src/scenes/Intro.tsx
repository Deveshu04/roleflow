import { Video } from "@remotion/media";
import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DarkLogo } from "../components/Brand";
import { Accent, FadeUp, Reveal } from "../components/Text";
import { Grain } from "../components/Ui";
import { heroVideo } from "../data";
import { colors, fonts, progress } from "../theme";

export const Sparkle: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.5))" }}>
    <path d="M12 2.6C12.55 2.6 12.88 3.15 13.08 4.7c.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z" />
  </svg>
);

export const Badge: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      padding: "14px 24px",
      borderRadius: 8,
      background: "linear-gradient(90deg, #7d7d7d 0%, #2a2a2a 52%, #0a0a0a 100%)",
      color: "#f2f2f2",
      fontSize: 30,
      letterSpacing: "-0.01em",
      ...style,
    }}
  >
    <Sparkle size={28} />
    AI Job Application Agent
  </div>
);

export const HeroBackdrop: React.FC<{ opacity: number; children?: React.ReactNode }> = ({ opacity, children }) => (
  <>
    <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 52% 40% at 50% 62%, rgba(0,0,0,0.72), rgba(0,0,0,0) 100%), linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.6))",
      }}
    />
    <Grain />
  </>
);

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const emphasis = progress(frame, 30, 40);

  return (
    <AbsoluteFill style={{ background: colors.black, fontFamily: fonts.sans, color: "#fff" }}>
      <HeroBackdrop opacity={0.75 * progress(frame, 0, 45)}>
        <Video
          src={heroVideo}
          muted
          objectFit="cover"
          premountFor={fps}
          style={{
            width: "100%",
            height: "100%",
            scale: String(interpolate(frame, [0, durationInFrames], [1.04, 1.12])),
          }}
        />
      </HeroBackdrop>

      <FadeUp at={6} distance={0} style={{ position: "absolute", left: 72, top: 56 }}>
        <DarkLogo />
      </FadeUp>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 120, textAlign: "center" }}>
        <FadeUp at={10} distance={16}>
          <Badge />
        </FadeUp>
        <div
          style={{
            marginTop: 36,
            fontSize: 124,
            fontWeight: 500,
            letterSpacing: "-0.045em",
            lineHeight: 1.1,
            textShadow: "0 4px 40px rgba(0,0,0,0.45)",
          }}
        >
          <Reveal at={18} duration={34}>
            Let{" "}
            <span style={{ opacity: 0.35 + 0.65 * emphasis, filter: `blur(${(1 - emphasis) * 4}px)` }}>
              <Accent color={colors.grey}>AI agents</Accent>
            </span>{" "}
            apply
          </Reveal>
          <Reveal at={28} duration={34}>
            to real jobs for you.
          </Reveal>
        </div>
        <FadeUp
          at={52}
          distance={16}
          style={{ marginTop: 40, fontSize: 38, lineHeight: 1.45, color: "#b4b4b4", letterSpacing: "-0.015em" }}
        >
          Finds live roles, tailors your resume, fills the real form.
          <br />
          <span style={{ color: "#fff" }}>Nothing is submitted until you approve.</span>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

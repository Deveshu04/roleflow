import { Video } from "@remotion/media";
import type React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { GitHubMark, LogoMark } from "../components/Brand";
import { FadeUp } from "../components/Text";
import { heroVideo } from "../data";
import { colors, fonts, progress } from "../theme";
import { HeroBackdrop } from "./Intro";

const glass: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 16,
  height: 84,
  padding: "0 34px",
  borderRadius: 14,
  fontSize: 36,
  letterSpacing: "-0.02em",
};

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 6, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ background: colors.black, fontFamily: fonts.sans, color: "#fff" }}>
      <HeroBackdrop opacity={0.5 * progress(frame, 0, 40)}>
        <Video
          src={heroVideo}
          muted
          objectFit="cover"
          trimBefore={60}
          premountFor={fps}
          style={{ width: "100%", height: "100%", scale: "1.08" }}
        />
      </HeroBackdrop>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30, opacity: pop, scale: String(0.9 + 0.1 * pop) }}>
          <LogoMark size={120} />
          <span style={{ fontSize: 132, fontWeight: 600, letterSpacing: "-0.05em" }}>Roleflow</span>
        </div>
        <FadeUp at={20} distance={16} style={{ marginTop: 26, fontSize: 42, color: "#b4b4b4", letterSpacing: "-0.02em" }}>
          The open-source AI job application agent.
        </FadeUp>
        <FadeUp at={34} distance={16} style={{ marginTop: 56, display: "flex", gap: 20 }}>
          <div
            style={{
              ...glass,
              color: "#111",
              fontWeight: 600,
              background: "linear-gradient(180deg, #ffffff 0%, #e7e7e7 48%, #cfcfcf 100%)",
              border: "1px solid #fff",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95)",
            }}
          >
            <GitHubMark size={38} />
            github.com/Deveshu04/roleflow
          </div>
          <div
            style={{
              ...glass,
              background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(0,0,0,0.5) 46%, rgba(150,170,200,0.1))",
              border: "1px solid rgba(198,198,198,0.55)",
            }}
          >
            Open source · MIT
          </div>
        </FadeUp>
        <FadeUp at={48} distance={12} style={{ marginTop: 40, fontSize: 32, color: colors.grey }}>
          Runs locally with your own OpenAI key.
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

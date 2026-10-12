import type React from "react";
import { AbsoluteFill, Img } from "remotion";
import { DarkLogo } from "./components/Brand";
import { Accent } from "./components/Text";
import { heroStill } from "./data";
import { Badge, HeroBackdrop } from "./scenes/Intro";
import { colors, fonts } from "./theme";

const STATS = ["LinkedIn, Greenhouse, Lever & Ashby", "Resume tailored to every job", "You approve every submission"];

export const Poster: React.FC = () => (
  <AbsoluteFill style={{ background: colors.black, fontFamily: fonts.sans, color: "#fff" }}>
    <HeroBackdrop opacity={0.75}>
      <Img src={heroStill} style={{ width: "100%", height: "100%", objectFit: "cover", scale: "1.08" }} />
    </HeroBackdrop>
    <DarkLogo style={{ position: "absolute", left: 72, top: 56 }} />
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 40, textAlign: "center" }}>
      <Badge />
      <div
        style={{
          marginTop: 36,
          fontSize: 128,
          fontWeight: 500,
          letterSpacing: "-0.045em",
          lineHeight: 1.1,
          textShadow: "0 4px 40px rgba(0,0,0,0.45)",
        }}
      >
        Let <Accent color={colors.grey}>AI agents</Accent> apply
        <br />
        to real jobs for you.
      </div>
      <div
        style={{
          marginTop: 48,
          display: "inline-flex",
          alignItems: "center",
          gap: 18,
          height: 84,
          padding: "0 34px 0 26px",
          borderRadius: 14,
          fontSize: 36,
          fontWeight: 600,
          color: "#111",
          background: "linear-gradient(180deg, #ffffff 0%, #e7e7e7 48%, #cfcfcf 100%)",
          border: "1px solid #fff",
        }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="#111" aria-hidden>
          <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
        </svg>
        Watch the demo
      </div>
    </AbsoluteFill>
    <div
      style={{
        position: "absolute",
        left: 96,
        right: 96,
        bottom: 64,
        display: "flex",
        justifyContent: "space-between",
        fontSize: 30,
        color: "#d8d8d8",
      }}
    >
      {STATS.map((s) => (
        <span key={s}>{s}</span>
      ))}
    </div>
  </AbsoluteFill>
);

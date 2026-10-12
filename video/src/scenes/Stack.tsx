import { Check, Chrome, Server, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import type React from "react";
import { AbsoluteFill } from "remotion";
import { Accent, FadeUp, Reveal } from "../components/Text";
import { Grain } from "../components/Ui";
import { colors, fonts } from "../theme";

const TILES: [LucideIcon, string, string][] = [
  [Server, "Next.js 16", "App and API, bound to localhost"],
  [Sparkles, "OpenAI gpt-5.5", "Parses, matches, tailors, drives the agent"],
  [Chrome, "Playwright", "Operates a real Chrome browser"],
  [ShieldCheck, "Guardrails", "Enforced in code, not just in prompts"],
];

const RULES = [
  "Never guesses demographic answers",
  "No submit while required fields are empty",
  "Server listens on localhost only",
  "Token cap on every run",
];

export const Stack: React.FC = () => (
  <AbsoluteFill style={{ background: colors.black, fontFamily: fonts.sans, color: "#fff" }}>
    <Grain />
    <div style={{ position: "absolute", left: 135, top: 128 }}>
      <FadeUp at={0} distance={14}>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: colors.grey }}>
          Under the hood
        </div>
      </FadeUp>
      <div style={{ marginTop: 16, fontSize: 76, fontWeight: 500, letterSpacing: "-0.045em", lineHeight: 1.08 }}>
        <Reveal at={4}>
          Runs on your machine. <Accent color={colors.grey}>Guarded</Accent> in code.
        </Reveal>
      </div>
    </div>

    <div style={{ position: "absolute", left: 135, right: 135, top: 372, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 30 }}>
      {TILES.map(([Icon, name, role], i) => (
        <FadeUp key={name} at={20 + i * 8} distance={30}>
          <div
            style={{
              height: 270,
              padding: 36,
              borderRadius: 26,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 55%, rgba(160,175,200,0.06))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            <Icon size={40} strokeWidth={1.8} color="#e8e8e8" />
            <div style={{ marginTop: 26, fontSize: 40, fontWeight: 600, letterSpacing: "-0.03em" }}>{name}</div>
            <div style={{ marginTop: 10, fontSize: 28, lineHeight: 1.35, color: "#a8a8a8" }}>{role}</div>
          </div>
        </FadeUp>
      ))}
    </div>

    <div
      style={{
        position: "absolute",
        left: 135,
        right: 135,
        top: 730,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        rowGap: 34,
        columnGap: 60,
      }}
    >
      {RULES.map((rule, i) => (
        <FadeUp
          key={rule}
          at={70 + i * 10}
          distance={20}
          style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 36, letterSpacing: "-0.02em" }}
        >
          <span
            style={{
              width: 48,
              height: 48,
              flex: "none",
              borderRadius: 99,
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.1)",
            }}
          >
            <Check size={28} strokeWidth={2.4} />
          </span>
          {rule}
        </FadeUp>
      ))}
    </div>
  </AbsoluteFill>
);

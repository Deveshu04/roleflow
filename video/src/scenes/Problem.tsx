import type React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Accent, Reveal } from "../components/Text";
import { Grain } from "../components/Ui";
import { colors, fonts, progress } from "../theme";

const chores = ["Find the role.", "Rewrite your resume for it.", "Fill the same form. Again."];

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const recede = progress(frame, 78, 26);

  return (
    <AbsoluteFill style={{ background: colors.black, fontFamily: fonts.sans, color: "#fff" }}>
      <Grain />
      <div
        style={{
          position: "absolute",
          left: 200,
          top: 250,
          fontSize: 76,
          fontWeight: 500,
          letterSpacing: "-0.04em",
          lineHeight: 1.25,
          opacity: 1 - recede,
          filter: `blur(${recede * 6}px)`,
          translate: `0 ${-recede * 40}px`,
        }}
      >
        {chores.map((line, i) => (
          <Reveal key={line} at={6 + i * 16} duration={28}>
            <span style={{ color: i === 2 ? "#fff" : "#8c8c8c" }}>{line}</span>
          </Reveal>
        ))}
        <Reveal at={58} duration={28} style={{ marginTop: 28 }}>
          <span style={{ fontSize: 44, color: colors.grey, letterSpacing: "-0.02em" }}>— for every single application.</span>
        </Reveal>
      </div>

      <div
        style={{
          position: "absolute",
          left: 200,
          top: 420,
          fontSize: 104,
          fontWeight: 500,
          letterSpacing: "-0.045em",
          lineHeight: 1.12,
        }}
      >
        <Reveal at={92} duration={32}>
          Roleflow does the <Accent color={colors.grey}>busywork.</Accent>
        </Reveal>
        <Reveal at={104} duration={32}>
          You make the call.
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

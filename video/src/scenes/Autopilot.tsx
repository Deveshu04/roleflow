import { ListChecks, MousePointerClick, Search, ShieldCheck, UserRound, Wand2, type LucideIcon } from "lucide-react";
import type React from "react";
import { useCurrentFrame } from "remotion";
import { Camera, Ring, Shot } from "../components/Camera";
import { Accent, FadeUp } from "../components/Text";
import { ProductScene, TimedChip } from "../components/Ui";
import { ui } from "../data";
import { colors, progress } from "../theme";

const STEPS: [LucideIcon, string][] = [
  [Search, "Search live jobs"],
  [ListChecks, "Pick the best matches"],
  [Wand2, "Tailor resume + cover letter"],
  [MousePointerClick, "Fill the application"],
  [UserRound, "Wait for your approval"],
];
const STEP_AT = 40;
const STEP_GAP = 26;
const ROW = 108;

const Pipeline: React.FC = () => {
  const frame = useCurrentFrame();
  const fill = progress(frame, STEP_AT, STEP_GAP * (STEPS.length - 1), (t) => t);

  return (
    <div style={{ position: "absolute", left: 1110, top: 300, width: 700 }}>
      <div style={{ position: "absolute", left: 35, top: 36, width: 3, height: ROW * (STEPS.length - 1), background: colors.line }} />
      <div
        style={{ position: "absolute", left: 35, top: 36, width: 3, height: ROW * (STEPS.length - 1) * fill, background: colors.accent }}
      />
      {STEPS.map(([Icon, label], i) => {
        const on = progress(frame, STEP_AT + i * STEP_GAP, 12);
        const last = i === STEPS.length - 1;
        const tint = last ? colors.warn : colors.accent;
        return (
          <FadeUp
            key={label}
            at={8 + i * 5}
            distance={16}
            style={{ position: "absolute", top: i * ROW, display: "flex", alignItems: "center", gap: 28 }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 99,
                display: "grid",
                placeItems: "center",
                border: `3px solid ${on > 0.5 ? tint : colors.line}`,
                background: on > 0.5 ? tint : "#fff",
                color: on > 0.5 ? "#fff" : colors.muted,
                scale: String(1 + 0.08 * Math.sin(Math.PI * on)),
              }}
            >
              <Icon size={32} strokeWidth={2.1} />
            </div>
            <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.025em", color: on > 0.5 ? colors.ink : colors.muted }}>
              {label}
            </div>
          </FadeUp>
        );
      })}
      <FadeUp
        at={STEP_AT + STEP_GAP * STEPS.length + 10}
        style={{ position: "absolute", top: ROW * STEPS.length + 10, fontSize: 32, color: colors.muted, lineHeight: 1.35 }}
      >
        One job at a time, for as many as you ask —
        <br />
        still pausing for your answers and approval.
      </FadeUp>
    </div>
  );
};

export const Autopilot: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = progress(frame, 4, 26);

  return (
    <ProductScene
      eyebrow="06 — Autopilot"
      title={
        <>
          Or let Autopilot run the <Accent color={colors.accent}>whole loop.</Accent>
        </>
      }
    >
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 300,
          width: 900,
          height: 602,
          borderRadius: 28,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 40px 90px rgba(29,29,27,0.12)",
          opacity: enter,
          translate: `0 ${(1 - enter) * 40}px`,
        }}
      >
        <Camera
          width={900}
          height={602}
          keys={[
            { at: 0, x: 768, y: 514, zoom: 0.555 },
            { at: 240, x: 768, y: 520, zoom: 0.585 },
          ]}
        >
          <Shot {...ui.autopilot} />
          <Ring rect={{ x: 40, y: 524, w: 900, h: 100 }} at={150} color={colors.accent} radius={16} thickness={5} />
        </Camera>
      </div>
      <TimedChip at={160} icon={ShieldCheck} style={{ position: "absolute", left: 120, top: 926 }}>
        Auto-submit is off by default
      </TimedChip>
      <Pipeline />
    </ProductScene>
  );
};

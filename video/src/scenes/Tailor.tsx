import { FileText, ShieldCheck } from "lucide-react";
import type React from "react";
import { useCurrentFrame } from "remotion";
import { Camera, type Rect, Shot } from "../components/Camera";
import { Accent } from "../components/Text";
import { Point, ProductScene, TimedChip } from "../components/Ui";
import { tailorChanges, ui } from "../data";
import { colors, easeInOut, progress } from "../theme";

const CARD_AT = [26, 92, 158];
const GUARDRAILS_AT = 224;

// Where each change lands on the rendered resume page (image pixels).
const MARKS: Rect[] = [
  { x: 84, y: 150, w: 716, h: 50 },
  { x: 84, y: 500, w: 884, h: 108 },
  { x: 84, y: 728, w: 1134, h: 204 },
];

const Marker: React.FC<{ rect: Rect; at: number }> = ({ rect, at }) => {
  const t = progress(useCurrentFrame(), at, 18, easeInOut);
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w * t,
        height: rect.h,
        borderRadius: 10,
        background: "rgba(63, 99, 87, 0.16)",
        borderLeft: t > 0 ? `6px solid ${colors.accent}` : undefined,
        mixBlendMode: "multiply",
      }}
    />
  );
};

const ChangeCard: React.FC<{ section: string; change: string; reason: string; at: number }> = ({ section, change, reason, at }) => {
  const t = progress(useCurrentFrame(), at, 24);
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${colors.line}`,
        borderRadius: 22,
        padding: "24px 30px",
        boxShadow: "0 14px 34px rgba(29,29,27,0.07)",
        opacity: t,
        translate: `0 ${(1 - t) * 40}px`,
      }}
    >
      <div style={{ fontSize: 30, lineHeight: 1.36, letterSpacing: "-0.01em" }}>
        <b style={{ fontWeight: 650 }}>{section}:</b> {change}
      </div>
      <div style={{ marginTop: 10, fontSize: 25, lineHeight: 1.36, color: colors.muted }}>{reason}</div>
    </div>
  );
};

export const Tailor: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = progress(frame, 4, 26);
  const shift = progress(frame, CARD_AT[2] - 4, 24, easeInOut);
  const cardsOut = progress(frame, GUARDRAILS_AT - 12, 16);
  const spread = progress(frame, GUARDRAILS_AT, 30, easeInOut);

  return (
    <ProductScene
      eyebrow="03 — Tailor"
      title={
        <>
          Every change <Accent color={colors.accent}>explained.</Accent> Nothing invented.
        </>
      }
    >
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 270,
          width: 800,
          height: 730,
          overflow: "hidden",
          maskImage: "linear-gradient(180deg, transparent 0, #000 24px)",
          opacity: 1 - cardsOut,
        }}
      >
        <div style={{ display: "grid", gap: 22, paddingTop: 20, translate: `0 ${-shift * 232}px` }}>
          {tailorChanges.map((c, i) => (
            <ChangeCard key={c.section} {...c} at={CARD_AT[i]} />
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", left: 120, top: 330, width: 800, display: "grid", gap: 52 }}>
        <Point at={GUARDRAILS_AT + 4} icon={ShieldCheck} title="Employers, dates & education restored from your original" />
        <Point at={GUARDRAILS_AT + 18} icon={ShieldCheck} title="Skills not in your resume are dropped" />
        <Point at={GUARDRAILS_AT + 32} icon={ShieldCheck} title="Unmet requirements listed — never claimed" />
      </div>

      <div
        style={{
          position: "absolute",
          left: 1000,
          top: 270,
          width: 800,
          height: 730,
          borderRadius: 18,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 30px 70px rgba(29,29,27,0.12)",
          opacity: spread,
          translate: `${spread * 70}px ${spread * 24}px`,
          rotate: `${spread * 3.5}deg`,
        }}
      >
        <Camera width={800} height={730} keys={[{ at: 0, x: 654, y: 560, zoom: 0.62 }]}>
          <Shot {...ui.coverLetter} />
        </Camera>
      </div>

      <div
        style={{
          position: "absolute",
          left: 1000,
          top: 270,
          width: 800,
          height: 730,
          borderRadius: 18,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 40px 90px rgba(29,29,27,0.16)",
          opacity: enter,
          translate: `${-spread * 40}px ${(1 - enter) * 40 - spread * 10}px`,
          rotate: `${-spread * 1.5}deg`,
        }}
      >
        <Camera
          width={800}
          height={730}
          keys={[
            { at: 0, x: 654, y: 560, zoom: 0.62 },
            { at: 24, x: 654, y: 560, zoom: 0.62 },
            { at: 54, x: 560, y: 300, zoom: 0.82 },
            { at: 92, x: 560, y: 300, zoom: 0.82 },
            { at: 120, x: 560, y: 560, zoom: 0.82 },
            { at: 158, x: 560, y: 560, zoom: 0.82 },
            { at: 186, x: 640, y: 820, zoom: 0.66 },
            { at: GUARDRAILS_AT - 4, x: 640, y: 820, zoom: 0.66 },
            { at: GUARDRAILS_AT + 30, x: 654, y: 620, zoom: 0.6 },
          ]}
        >
          <Shot {...ui.resume} />
          {MARKS.map((rect, i) => (
            <Marker key={rect.y} rect={rect} at={CARD_AT[i] + 26} />
          ))}
        </Camera>
      </div>

      <TimedChip at={GUARDRAILS_AT + 30} icon={FileText} style={{ position: "absolute", left: 1150, top: 930 }}>
        PDF resume + cover letter
      </TimedChip>
    </ProductScene>
  );
};

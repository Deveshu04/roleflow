import { Building2, Gauge, Linkedin } from "lucide-react";
import type React from "react";
import { Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { Camera, Ring, Shot, Slice } from "../components/Camera";
import { Accent } from "../components/Text";
import { Cursor, Point, ProductScene } from "../components/Ui";
import { ui } from "../data";
import { colors, easeInOut, mix, progress } from "../theme";

const QUERY = "Machine learning engineer";
const TYPE_START = 28;
// Uneven keystroke gaps (in frames) so the typing doesn't look mechanical.
const GAPS = [2, 2, 2, 1, 2, 3, 2, 2, 1, 2, 2, 2, 3, 2, 2, 1, 2, 2, 2, 2, 3, 2, 2, 2];
const KEY_TIMES = GAPS.reduce((acc, gap) => [...acc, acc[acc.length - 1] + gap], [TYPE_START]);
const TYPE_END = KEY_TIMES[KEY_TIMES.length - 1];

const SearchPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const typed = QUERY.slice(0, KEY_TIMES.filter((t) => t <= frame).length);
  const typing = frame >= TYPE_START && frame <= TYPE_END;
  const caretOn = typing || Math.floor((frame - TYPE_END) / 8) % 2 === 1;
  const enter = progress(frame, 6, 26);
  const exit = progress(frame, 118, 18, easeInOut);
  const move = progress(frame, 82, 18, easeInOut);
  const press = progress(frame, 100, 12);

  return (
    <div
      style={{
        position: "absolute",
        left: 180,
        top: 280,
        width: 1560,
        height: 700,
        borderRadius: 28,
        overflow: "hidden",
        background: colors.paper,
        border: `1px solid ${colors.line}`,
        boxShadow: "0 40px 90px rgba(29,29,27,0.10)",
        opacity: enter * (1 - exit),
        translate: `0 ${(1 - enter) * 30 - exit * 20}px`,
        scale: String(1 - exit * 0.03),
      }}
    >
      <Camera
        width={1560}
        height={700}
        keys={[
          { at: 0, x: 840, y: 430, zoom: 0.86 },
          { at: 40, x: 840, y: 440, zoom: 0.9 },
          { at: 112, x: 840, y: 462, zoom: 1.0 },
        ]}
      >
        <Shot {...ui.searchEmpty} />
        <Shot {...ui.searchTyped} style={{ opacity: progress(frame, TYPE_START - 1, 2) }} />
        <div
          style={{
            position: "absolute",
            left: 168,
            top: 420,
            width: 917,
            height: 80,
            background: "#fff",
            opacity: frame < TYPE_START - 1 ? 0 : 1 - progress(frame, TYPE_END + 6, 6),
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 7,
              top: 11,
              height: 56,
              display: "flex",
              alignItems: "center",
              fontSize: 36,
              color: colors.ink,
            }}
          >
            {typed}
            <span style={{ width: 3, height: 42, marginLeft: 2, background: colors.ink, opacity: caretOn ? 1 : 0 }} />
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 1482,
            top: 416,
            width: 104,
            height: 88,
            borderRadius: 22,
            background: colors.accentDark,
            opacity: 0.35 * press * (1 - progress(frame, 108, 8)),
          }}
        />
        <Shot {...ui.searchLoading} style={{ opacity: progress(frame, 106, 6) }} />
        <Cursor
          x={mix(move, 1420, 1522)}
          y={mix(move, 760, 448)}
          size={46}
          press={press > 0 && press < 1 ? press : 0}
          style={{ opacity: progress(frame, 80, 8) * (1 - progress(frame, 112, 8)), scale: String(1 - 0.12 * Math.sin(Math.PI * press)) }}
        />
      </Camera>
    </div>
  );
};

const CARDS: [number, number][] = [
  [150, 292],
  [458, 292],
  [766, 332],
  [1114, 332],
  [1462, 294],
];

const ResultsPhase: React.FC = () => {
  const frame = useCurrentFrame();
  const header = progress(frame, 4, 22);

  return (
    <>
      <Camera
        width={900}
        height={730}
        style={{ left: 150, top: 270 }}
        keys={[
          { at: 0, x: 620, y: 514, zoom: 0.725 },
          { at: 70, x: 620, y: 514, zoom: 0.725 },
          { at: 182, x: 620, y: 760, zoom: 0.725 },
        ]}
      >
        <Slice image={ui.results} top={0} height={146} style={{ opacity: header, translate: `0 ${(1 - header) * 30}px` }} />
        {CARDS.map(([top, height], i) => {
          const t = progress(frame, 10 + i * 7, 26);
          return <Slice key={top} image={ui.results} top={top} height={height} style={{ opacity: t, translate: `0 ${(1 - t) * 60}px` }} />;
        })}
        {CARDS.map(([top], i) => (
          <Ring key={top} rect={{ x: 1046, y: top + 33, w: 134, h: 52 }} at={92 + i * 6} color={colors.accent} radius={26} thickness={5} />
        ))}
      </Camera>
      <div style={{ position: "absolute", left: 1130, top: 330, width: 680, display: "grid", gap: 56 }}>
        <Point at={24} icon={Linkedin} title="LinkedIn public listings" />
        <Point at={44} icon={Building2} title="Company career sites" sub="Greenhouse, Lever & Ashby — verified via their APIs" />
        <Point at={84} icon={Gauge} title="Ranked against your resume" sub="Every result gets a quick fit %" />
      </div>
    </>
  );
};

export const Search: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <ProductScene
      eyebrow="01 — Find"
      title={
        <>
          Live roles, <Accent color={colors.accent}>ranked</Accent> against your resume.
        </>
      }
    >
      <Sequence name="Search bar" durationInFrames={140} premountFor={fps}>
        <SearchPhase />
      </Sequence>
      <Sequence name="Results" from={120} premountFor={fps}>
        <ResultsPhase />
      </Sequence>
    </ProductScene>
  );
};

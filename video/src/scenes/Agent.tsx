import { CircleDot, MousePointerClick, Paperclip, TriangleAlert, UserRound, type LucideIcon } from "lucide-react";
import type React from "react";
import { useCurrentFrame } from "remotion";
import { Camera, Ring, Shot } from "../components/Camera";
import { Accent } from "../components/Text";
import { centered, ProductScene, TimedChip, Window } from "../components/Ui";
import { jobUrl, runEvents, ui, type RunEventKind } from "../data";
import { colors, easeInOut, progress } from "../theme";

const LIVE = { width: 1280, height: 860 };
const BROWSER = { left: 820, top: 262, width: 980 };
const ZOOM = BROWSER.width / LIVE.width;
const TIMELINE_HEIGHT = 690;
const GAP = 20;

// Value rows of the filled fields in the agent's frame, revealed top to bottom as the agent fills them.
const FIELDS = [
  { value: [18, 46], box: [-4, 54] },
  { value: [95, 122], box: [67, 129] },
  { value: [247, 274], box: [219, 281] },
  { value: [323, 350], box: [295, 357] },
  { value: [399, 426], box: [371, 433] },
  { value: [493, 520], box: [447, 527] },
  { value: [569, 596], box: [541, 603] },
  { value: [721, 748], box: [693, 755] },
];
const FILL_START = 104;
const FILL_STEP = 9;
const NOTICE = { x: 210, y: 614, w: 608, h: 68 };

const ICONS: Record<RunEventKind, [LucideIcon, string]> = {
  info: [CircleDot, colors.muted],
  action: [MousePointerClick, colors.accent],
  warning: [TriangleAlert, colors.warn],
  user: [UserRound, colors.warn],
};

const tops = runEvents.reduce<number[]>((acc, e, i) => [...acc, i === 0 ? 0 : acc[i - 1] + runEvents[i - 1].height + GAP], []);

const Timeline: React.FC = () => {
  const frame = useCurrentFrame();
  let scroll = 0;
  let previous = 0;
  runEvents.forEach((e, i) => {
    const target = Math.max(0, tops[i] + e.height - TIMELINE_HEIGHT + 8);
    scroll += (target - previous) * progress(frame, e.at, 20, easeInOut);
    previous = Math.max(previous, target);
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        top: 280,
        width: 640,
        height: TIMELINE_HEIGHT,
        overflow: "hidden",
        maskImage: "linear-gradient(180deg, transparent 0, #000 40px)",
      }}
    >
      {runEvents.map((e, i) => {
        const [Icon, tint] = ICONS[e.kind];
        const t = progress(frame, e.at, 20);
        return (
          <div
            key={e.label}
            style={{
              position: "absolute",
              top: tops[i] - scroll,
              left: 0,
              right: 0,
              height: e.height,
              display: "flex",
              gap: 20,
              opacity: t,
              translate: `${(1 - t) * -24}px 0`,
            }}
          >
            <Icon size={34} color={tint} strokeWidth={2.1} style={{ flex: "none", marginTop: 4 }} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 31,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                  color: e.kind === "user" ? colors.warn : colors.ink,
                }}
              >
                {e.label}
              </div>
              {e.detail && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 24,
                    lineHeight: 1.36,
                    color: colors.muted,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {e.detail}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const LiveView: React.FC = () => {
  const frame = useCurrentFrame();
  const opened = progress(frame, 34, 12);
  const form = progress(frame, 88, 8);
  const retried = progress(frame, 228, 8);

  return (
    <>
      <Camera
        width={BROWSER.width}
        height={LIVE.height * ZOOM}
        style={{ opacity: opened }}
        keys={[
          { at: 34, x: 640, y: 430, zoom: ZOOM },
          { at: 96, x: 640, y: 400, zoom: ZOOM * 1.05 },
        ]}
      >
        <Shot src={ui.live[0]} {...LIVE} />
      </Camera>
      <Camera
        width={BROWSER.width}
        height={LIVE.height * ZOOM}
        style={{ opacity: form }}
        keys={[
          { at: 0, x: 514, y: 290, zoom: 1.2 },
          { at: FILL_START, x: 514, y: 290, zoom: 1.2 },
          { at: 178, x: 514, y: 560, zoom: 1.2 },
          { at: 296, x: 514, y: 560, zoom: 1.2 },
          { at: 340, x: 640, y: 430, zoom: ZOOM },
        ]}
      >
        <Shot src={ui.live[1]} {...LIVE} />
        <Shot src={ui.live[2]} {...LIVE} style={{ opacity: retried }} />
        {FIELDS.map(({ value: [top, bottom] }, i) => {
          const wipe = 222 + 562 * progress(frame, FILL_START + i * FILL_STEP, 8, easeInOut);
          // The value and the dropdown's clear (×) icon are masked separately so the labels above stay visible.
          return (
            <div key={top}>
              <div
                style={{
                  position: "absolute",
                  left: wipe,
                  top: top - 2,
                  width: Math.max(0, 756 - wipe),
                  height: bottom - top + 4,
                  background: "#fff",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: Math.max(wipe, 756),
                  top: top - 8,
                  width: Math.max(0, 784 - Math.max(wipe, 756)),
                  height: bottom - top + 8,
                  background: "#fff",
                }}
              />
            </div>
          );
        })}
        {FIELDS.map(({ box: [top, bottom] }, i) => (
          <Ring
            key={top}
            rect={{ x: 210, y: top - 2, w: 608, h: bottom - top + 4 }}
            at={FILL_START + i * FILL_STEP - 4}
            until={FILL_START + i * FILL_STEP + 8}
            color={colors.accent}
            radius={8}
            thickness={3}
          />
        ))}
        <Ring rect={NOTICE} at={186} until={230} color={colors.warn} radius={8} thickness={4} />
        <Ring rect={NOTICE} at={230} until={292} color={colors.accent} radius={8} thickness={4} />
      </Camera>
    </>
  );
};

export const Agent: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = progress(frame, 4, 26);

  return (
    <ProductScene
      eyebrow="04 — Apply"
      title={
        <>
          A real browser fills the <Accent color={colors.accent}>real</Accent> form.
        </>
      }
    >
      <Timeline />
      <Window
        url={frame >= 32 ? jobUrl : ""}
        live
        style={{
          left: BROWSER.left,
          top: BROWSER.top,
          width: BROWSER.width,
          height: 50 + LIVE.height * ZOOM,
          opacity: enter,
          translate: `0 ${(1 - enter) * 40}px`,
        }}
      >
        <LiveView />
      </Window>
      <div style={{ position: "absolute", left: BROWSER.left, width: BROWSER.width, top: 934 }}>
        <TimedChip at={104} until={182} icon={MousePointerClick} style={centered}>
          Fills text fields, dropdowns & type-aheads
        </TimedChip>
        <TimedChip at={188} until={250} icon={TriangleAlert} tone="warn" style={centered}>
          No exact option? It retries with a real one
        </TimedChip>
        <TimedChip at={256} until={304} icon={Paperclip} style={centered}>
          Uploads your tailored resume + cover letter
        </TimedChip>
        <TimedChip at={308} icon={UserRound} tone="warn" style={centered}>
          Then it stops for your review
        </TimedChip>
      </div>
    </ProductScene>
  );
};

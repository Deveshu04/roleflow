import { Lock, TriangleAlert } from "lucide-react";
import type React from "react";
import { useCurrentFrame } from "remotion";
import { Camera, Ring, Shot } from "../components/Camera";
import { Accent } from "../components/Text";
import { centered, Cursor, ProductScene, TimedChip } from "../components/Ui";
import { ui } from "../data";
import { colors, easeInOut, mix, progress } from "../theme";

export const Review: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = progress(frame, 4, 26);
  const glide = progress(frame, 104, 36, easeInOut);

  return (
    <ProductScene
      eyebrow="05 — Review"
      title={
        <>
          Nothing is submitted until <Accent color={colors.accent}>you</Accent> approve.
        </>
      }
    >
      <div
        style={{
          position: "absolute",
          left: 180,
          top: 270,
          width: 1560,
          height: 720,
          borderRadius: 28,
          overflow: "hidden",
          background: colors.paper,
          opacity: enter,
          translate: `0 ${(1 - enter) * 40}px`,
        }}
      >
        <Camera
          width={1560}
          height={720}
          keys={[
            { at: 0, x: 1176, y: 560, zoom: 0.66 },
            { at: 64, x: 1176, y: 560, zoom: 0.68 },
            { at: 104, x: 760, y: 600, zoom: 1.05 },
            { at: 220, x: 740, y: 612, zoom: 1.1 },
          ]}
        >
          <Shot {...ui.agentReview} />
          <Ring
            rect={{ x: 66, y: 486, w: 2218, h: 84 }}
            at={36}
            until={100}
            color={colors.warn}
            radius={14}
            thickness={5}
            fill="rgba(138,97,22,0.06)"
          />
          <Ring rect={{ x: 66, y: 620, w: 642, h: 116 }} at={138} color={colors.accent} radius={22} thickness={5} />
          <Cursor x={mix(glide, 1500, 300)} y={mix(glide, 1000, 684)} size={52} style={{ opacity: progress(frame, 100, 10) }} />
        </Camera>
      </div>
      <div style={{ position: "absolute", left: 180, width: 1560, top: 880 }}>
        <TimedChip at={40} until={100} icon={TriangleAlert} tone="warn" style={centered}>
          Anything uncertain is flagged for you
        </TimedChip>
        <TimedChip at={150} icon={Lock} style={centered}>
          The final submit stays locked until you approve
        </TimedChip>
      </div>
    </ProductScene>
  );
};

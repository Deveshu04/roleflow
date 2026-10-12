import { Check, Gauge, Plus } from "lucide-react";
import type React from "react";
import { useCurrentFrame } from "remotion";
import { Camera, Ring, Shot } from "../components/Camera";
import { Accent } from "../components/Text";
import { Point, ProductScene } from "../components/Ui";
import { ui } from "../data";
import { colors, progress } from "../theme";

export const Match: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = progress(frame, 4, 26);

  return (
    <ProductScene
      eyebrow="02 — Match"
      title={
        <>
          Know the <Accent color={colors.accent}>fit</Accent> before you apply.
        </>
      }
    >
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 270,
          width: 900,
          height: 730,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 40px 90px rgba(29,29,27,0.12)",
          opacity: enter,
          translate: `0 ${(1 - enter) * 40}px`,
        }}
      >
        <Camera
          width={900}
          height={730}
          keys={[
            { at: 0, x: 564, y: 458, zoom: 0.798 },
            { at: 76, x: 564, y: 458, zoom: 0.798 },
            { at: 146, x: 564, y: 1290, zoom: 0.798 },
          ]}
        >
          <Shot {...ui.match} />
          <Ring rect={{ x: 34, y: 436, w: 720, h: 104 }} at={30} until={84} color={colors.accent} radius={22} thickness={5} />
          <Ring
            rect={{ x: 28, y: 840, w: 536, h: 960 }}
            at={146}
            color={colors.accent}
            radius={24}
            thickness={5}
            fill="rgba(63,99,87,0.05)"
          />
          <Ring
            rect={{ x: 566, y: 840, w: 548, h: 960 }}
            at={162}
            color={colors.warn}
            radius={24}
            thickness={5}
            fill="rgba(138,97,22,0.05)"
          />
        </Camera>
      </div>
      <div style={{ position: "absolute", left: 1130, top: 340, width: 680, display: "grid", gap: 56 }}>
        <Point at={22} icon={Gauge} title="A score out of 100" sub="An estimate, not a verdict" />
        <Point at={140} icon={Check} title="Evidence from your resume" />
        <Point at={156} icon={Plus} title="Gaps, stated plainly" sub="So you know what to address" />
      </div>
    </ProductScene>
  );
};

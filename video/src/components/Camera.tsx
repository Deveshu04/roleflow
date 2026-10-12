import type React from "react";
import { Img, useCurrentFrame } from "remotion";
import { easeInOut, mix, progress } from "../theme";

export type CameraKey = { at: number; x: number; y: number; zoom: number };

// Pans and zooms over content laid out in image pixels; (x, y) is the point kept at the viewport centre.
export const Camera: React.FC<{
  width: number;
  height: number;
  keys: CameraKey[];
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width, height, keys, children, style }) => {
  const frame = useCurrentFrame();
  let { x, y, zoom } = keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    const t = progress(frame, a.at, b.at - a.at, easeInOut);
    if (t <= 0) break;
    x = mix(t, a.x, b.x);
    y = mix(t, a.y, b.y);
    zoom = mix(t, a.zoom, b.zoom);
  }
  return (
    <div style={{ position: "absolute", width, height, overflow: "hidden", ...style }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformOrigin: "0 0",
          translate: `${width / 2 - x * zoom}px ${height / 2 - y * zoom}px`,
          scale: String(zoom),
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const Shot: React.FC<{ src: string; width: number; height: number; style?: React.CSSProperties }> = ({
  src,
  width,
  height,
  style,
}) => <Img src={src} style={{ position: "absolute", left: 0, top: 0, width, height, display: "block", ...style }} />;

export type Screenshot = { src: string; width: number; height: number };

// A horizontal band of a screenshot, so parts of one image can animate independently.
export const Slice: React.FC<{ image: Screenshot; top: number; height: number; style?: React.CSSProperties }> = ({
  image,
  top,
  height,
  style,
}) => (
  <div style={{ position: "absolute", left: 0, top, width: image.width, height, overflow: "hidden", ...style }}>
    <Img src={image.src} style={{ position: "absolute", left: 0, top: -top, width: image.width, height: image.height }} />
  </div>
);

export type Rect = { x: number; y: number; w: number; h: number };

export const Ring: React.FC<{
  rect: Rect;
  at: number;
  until?: number;
  color: string;
  radius?: number;
  thickness?: number;
  fill?: string;
}> = ({ rect, at, until = Infinity, color, radius = 16, thickness = 4, fill = "transparent" }) => {
  const frame = useCurrentFrame();
  const t = progress(frame, at, 18) * (1 - progress(frame, until, 12));
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        borderRadius: radius,
        border: `${thickness}px solid ${color}`,
        background: fill,
        boxShadow: `0 0 0 ${thickness * 2.5}px ${color}22`,
        opacity: t,
        scale: String(1.06 - 0.06 * t),
      }}
    />
  );
};

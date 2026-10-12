import { loadFont } from "@remotion/fonts";
import { Easing, interpolate, staticFile } from "remotion";

loadFont({ family: "Inter", url: staticFile("fonts/inter.woff2"), weight: "100 900" });
loadFont({ family: "Instrument Serif", url: staticFile("fonts/instrument-serif-italic.woff2"), style: "italic" });

export const FPS = 30;

export const fonts = {
  sans: '"Inter", system-ui, sans-serif',
  serif: '"Instrument Serif", "Times New Roman", serif',
};

export const colors = {
  paper: "#f7f6f2",
  ink: "#1d1d1b",
  muted: "#6b6a64",
  line: "#e5e3dc",
  accent: "#3f6357",
  accentDark: "#2f4a41",
  soft: "#ecf1ee",
  warn: "#8a6116",
  warnSoft: "#f7efdc",
  black: "#000000",
  grey: "#9a9a9a",
};

// The landing page's "expo out" curve, used for nearly every entrance.
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

// 0 → 1 between `start` and `start + duration`; an infinite start means "never".
export const progress = (frame: number, start: number, duration: number, easing = easeOut) =>
  Number.isFinite(start)
    ? interpolate(frame, [start, start + duration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing,
      })
    : 0;

export const mix = (t: number, from: number, to: number) => from + (to - from) * t;

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type React from "react";
import { Sequence, useVideoConfig } from "remotion";
import { Agent } from "./scenes/Agent";
import { Review } from "./scenes/Review";
import { Search } from "./scenes/Search";
import { Tailor } from "./scenes/Tailor";

// Short loop for the README GIF: the most telling moments of four scenes, cut together.
const CLIPS = {
  typing: { start: 22, duration: 92 },
  results: { start: 140, duration: 90 },
  tailor: { start: 18, duration: 80 },
  agent: { start: 92, duration: 110 },
  review: { start: 96, duration: 84 },
};
const FADE = 10;
const fadeTiming = linearTiming({ durationInFrames: FADE });

export const HIGHLIGHT_DURATION = Object.values(CLIPS).reduce((sum, c) => sum + c.duration, 0) - FADE * (Object.keys(CLIPS).length - 1);

// Plays a scene starting `start` frames in.
const From: React.FC<{ start: number; children: React.ReactNode }> = ({ start, children }) => <Sequence from={-start}>{children}</Sequence>;

export const Highlight: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Typing" durationInFrames={CLIPS.typing.duration} premountFor={fps}>
        <From start={CLIPS.typing.start}>
          <Search />
        </From>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence name="Results" durationInFrames={CLIPS.results.duration} premountFor={fps}>
        <From start={CLIPS.results.start}>
          <Search />
        </From>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence name="Tailor" durationInFrames={CLIPS.tailor.duration} premountFor={fps}>
        <From start={CLIPS.tailor.start}>
          <Tailor />
        </From>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence name="Agent" durationInFrames={CLIPS.agent.duration} premountFor={fps}>
        <From start={CLIPS.agent.start}>
          <Agent />
        </From>
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence name="Review" durationInFrames={CLIPS.review.duration} premountFor={fps}>
        <From start={CLIPS.review.start}>
          <Review />
        </From>
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type React from "react";
import { useVideoConfig } from "remotion";
import { Agent } from "./scenes/Agent";
import { Autopilot } from "./scenes/Autopilot";
import { Intro } from "./scenes/Intro";
import { Match } from "./scenes/Match";
import { Outro } from "./scenes/Outro";
import { Problem } from "./scenes/Problem";
import { Review } from "./scenes/Review";
import { Search } from "./scenes/Search";
import { Stack } from "./scenes/Stack";
import { Tailor } from "./scenes/Tailor";

export const SCENES = {
  intro: 195,
  problem: 165,
  search: 300,
  match: 195,
  tailor: 300,
  agent: 360,
  review: 210,
  autopilot: 240,
  stack: 225,
  outro: 210,
};

const FADE = 15;
const fadeTiming = linearTiming({ durationInFrames: FADE });

export const DEMO_DURATION = Object.values(SCENES).reduce((a, b) => a + b, 0) - FADE * (Object.keys(SCENES).length - 1);

export const Demo: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Intro" durationInFrames={SCENES.intro} premountFor={fps}>
        <Intro />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence name="Problem" durationInFrames={SCENES.problem} premountFor={fps}>
        <Problem />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence name="Find" durationInFrames={SCENES.search} premountFor={fps}>
        <Search />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence name="Match" durationInFrames={SCENES.match} premountFor={fps}>
        <Match />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence name="Tailor" durationInFrames={SCENES.tailor} premountFor={fps}>
        <Tailor />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence name="Apply" durationInFrames={SCENES.agent} premountFor={fps}>
        <Agent />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence name="Review" durationInFrames={SCENES.review} premountFor={fps}>
        <Review />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence name="Autopilot" durationInFrames={SCENES.autopilot} premountFor={fps}>
        <Autopilot />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence name="Under the hood" durationInFrames={SCENES.stack} premountFor={fps}>
        <Stack />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence name="Outro" durationInFrames={SCENES.outro} premountFor={fps}>
        <Outro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

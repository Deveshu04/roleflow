import type React from "react";
import { Composition, Folder, Still } from "remotion";
import { Demo, DEMO_DURATION, SCENES } from "./Demo";
import { Highlight, HIGHLIGHT_DURATION } from "./Highlight";
import { Poster } from "./Poster";
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
import { FPS } from "./theme";

const frame = { width: 1920, height: 1080, fps: FPS };

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="RoleflowDemo" component={Demo} durationInFrames={DEMO_DURATION} {...frame} />
    <Composition id="RoleflowHighlight" component={Highlight} durationInFrames={HIGHLIGHT_DURATION} {...frame} />
    <Still id="RoleflowPoster" component={Poster} width={1920} height={1080} />
    <Folder name="Scenes">
      <Composition id="Intro" component={Intro} durationInFrames={SCENES.intro} {...frame} />
      <Composition id="Problem" component={Problem} durationInFrames={SCENES.problem} {...frame} />
      <Composition id="Find" component={Search} durationInFrames={SCENES.search} {...frame} />
      <Composition id="Match" component={Match} durationInFrames={SCENES.match} {...frame} />
      <Composition id="Tailor" component={Tailor} durationInFrames={SCENES.tailor} {...frame} />
      <Composition id="Apply" component={Agent} durationInFrames={SCENES.agent} {...frame} />
      <Composition id="Review" component={Review} durationInFrames={SCENES.review} {...frame} />
      <Composition id="Autopilot" component={Autopilot} durationInFrames={SCENES.autopilot} {...frame} />
      <Composition id="UnderTheHood" component={Stack} durationInFrames={SCENES.stack} {...frame} />
      <Composition id="Outro" component={Outro} durationInFrames={SCENES.outro} {...frame} />
    </Folder>
  </>
);

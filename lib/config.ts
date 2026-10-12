import path from "path";

export const config = {
  openaiKey: () => process.env.OPENAI_API_KEY?.trim() || "",
  model: () => process.env.OPENAI_MODEL?.trim() || "gpt-5.5",
  agentModel: () =>
    process.env.OPENAI_AGENT_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || "gpt-5.5",
  // chrome | msedge | chromium
  browserChannel: () => process.env.BROWSER_CHANNEL?.trim() || "chrome",
  headless: () => process.env.HEADLESS === "true",
  maxAgentSteps: () => Number(process.env.AGENT_MAX_STEPS || 40),
  maxRunTokens: () => Number(process.env.AGENT_MAX_RUN_TOKENS || 150_000),
  // turbopackIgnore keeps private data out of build file tracing.
  dataDir: process.env.ROLEFLOW_DATA_DIR?.trim() || path.join(/* turbopackIgnore: true */ process.cwd(), "data"),
};

export const dataPath = (...parts: string[]) => path.join(config.dataDir, ...parts);

import { promises as fs } from "fs";
import { chromium, type Browser, type BrowserContext } from "playwright";
import { config, dataPath } from "../config";

type BrowserState = { context?: Promise<BrowserContext>; headless?: Promise<Browser> };
// On globalThis so dev-server reloads never launch a second browser on the same profile.
const state = ((globalThis as { __roleflowBrowser?: BrowserState }).__roleflowBrowser ??= {});

function channels() {
  const preferred = config.browserChannel();
  return [...new Set([preferred, "chrome", "msedge", "chromium"])];
}

async function withChannelFallback<T>(launch: (channel: string) => Promise<T>) {
  let last: unknown;
  for (const channel of channels()) {
    try {
      return await launch(channel);
    } catch (err) {
      last = err;
    }
  }
  throw last;
}

// Persistent profile: the user's own sign-ins (LinkedIn, ATS accounts) carry over between runs.
export function agentContext() {
  state.context ??= withChannelFallback((channel) =>
    chromium.launchPersistentContext(dataPath("browser-profile"), {
      channel,
      headless: config.headless(),
      viewport: { width: 1280, height: 860 },
      acceptDownloads: false,
    }),
  ).then((ctx) => {
    ctx.on("close", () => {
      state.context = undefined;
    });
    return ctx;
  });
  state.context.catch(() => {
    state.context = undefined;
  });
  return state.context;
}

export function isAgentBrowserOpen() {
  return Boolean(state.context);
}

export async function closeAgentBrowser() {
  const ctx = await state.context?.catch(() => undefined);
  state.context = undefined;
  await ctx?.close().catch(() => {});
}

export function headlessBrowser() {
  state.headless ??= withChannelFallback((channel) => chromium.launch({ channel, headless: true })).then((b) => {
    b.on("disconnected", () => {
      state.headless = undefined;
    });
    return b;
  });
  state.headless.catch(() => {
    state.headless = undefined;
  });
  return state.headless;
}

const linkedInMarker = () => dataPath("linkedin-session.json");

// With the browser closed, report the last observed state; the session persists on disk.
export async function linkedInSignedIn() {
  const ctx = state.context ? await state.context.catch(() => undefined) : undefined;
  if (!ctx) {
    try {
      return (JSON.parse(await fs.readFile(linkedInMarker(), "utf8")) as { signedIn: boolean }).signedIn;
    } catch {
      return false;
    }
  }
  const cookies = await ctx.cookies("https://www.linkedin.com").catch(() => []);
  const signedIn = cookies.some((c) => c.name === "li_at" && c.value);
  await fs.mkdir(dataPath(), { recursive: true }).catch(() => {});
  await fs.writeFile(linkedInMarker(), JSON.stringify({ signedIn, checkedAt: new Date().toISOString() })).catch(() => {});
  return signedIn;
}

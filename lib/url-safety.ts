import { isIP } from "net";

const PRIVATE_V4 = [/^10\./, /^127\./, /^0\./, /^169\.254\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./];

// Blocks file:, localhost and private-network targets (SSRF, prompt-injected navigation).
export function isPublicHttpUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;
  const ip = isIP(host);
  if (ip === 4) return !PRIVATE_V4.some((r) => r.test(host));
  if (ip === 6) return !(host === "::1" || host === "::" || /^f[cd]/.test(host) || /^fe80/.test(host) || host.startsWith("::ffff:"));
  return true;
}

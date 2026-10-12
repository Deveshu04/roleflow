import { lookup } from "dns/promises";
import { isIP } from "net";

const PRIVATE_V4 = [/^10\./, /^127\./, /^0\./, /^169\.254\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./];
const LOCAL_NAME = /(^|\.)(localhost|local|internal|home\.arpa)$/;

export function isPrivateAddress(ip: string): boolean {
  const addr = ip.toLowerCase();
  if (isIP(addr) === 4) return PRIVATE_V4.some((r) => r.test(addr));
  if (isIP(addr) === 6) {
    const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return addr === "::1" || addr === "::" || /^f[cd]/.test(addr) || /^fe[89ab]/.test(addr) || addr.startsWith("::ffff:");
  }
  return true;
}

const hostOf = (url: URL) => url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();

// Syntactic check: http(s) only, and no literal local or private host.
export function isPublicHttpUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const host = hostOf(url);
  if (!host || LOCAL_NAME.test(host)) return false;
  return isIP(host) ? !isPrivateAddress(host) : true;
}

// Also resolves DNS, so a public-looking name can't point at a private address.
export async function isPublicHttpTarget(raw: string) {
  if (!isPublicHttpUrl(raw)) return false;
  const host = hostOf(new URL(raw));
  if (isIP(host)) return true;
  try {
    const addresses = await lookup(host, { all: true });
    return addresses.length > 0 && addresses.every((a) => !isPrivateAddress(a.address));
  } catch {
    return false;
  }
}

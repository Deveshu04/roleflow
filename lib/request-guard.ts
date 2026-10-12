const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

// The API has no auth because it only serves this machine; refuse anything a remote page could send.
export function rejectRequest(method: string, host: string | null, origin: string | null, fetchSite: string | null) {
  const hostname = (host ?? "").toLowerCase().replace(/:\d+$/, "");
  if (!LOCAL_HOSTS.has(hostname)) return "Roleflow only accepts requests addressed to localhost.";
  if (fetchSite === "cross-site" || fetchSite === "same-site") return "Cross-site requests are not allowed.";
  if (method !== "GET" && method !== "HEAD" && origin) {
    try {
      if (new URL(origin).host !== host) return "Cross-origin requests are not allowed.";
    } catch {
      return "Cross-origin requests are not allowed.";
    }
  }
  return null;
}

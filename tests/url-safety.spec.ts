import { expect, test } from "@playwright/test";
import { isPublicHttpUrl } from "../lib/url-safety";

test("only public http(s) URLs may be fetched or opened by the agent", () => {
  for (const ok of ["https://jobs.lever.co/acme/123", "http://example.com/careers", "https://8.8.8.8/x"]) expect(isPublicHttpUrl(ok), ok).toBe(true);
  for (const bad of [
    "file:///C:/Users/me/.ssh/id_rsa",
    "javascript:alert(1)",
    "http://localhost:3000/api/profile",
    "http://127.0.0.1:3000",
    "http://192.168.1.10/admin",
    "http://10.0.0.5",
    "http://172.20.1.1",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]:3000",
    "http://router.local",
    "not a url",
  ])
    expect(isPublicHttpUrl(bad), bad).toBe(false);
});

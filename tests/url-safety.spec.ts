import { expect, test } from "@playwright/test";
import { rejectRequest } from "../lib/request-guard";
import { isPrivateAddress, isPublicHttpTarget, isPublicHttpUrl } from "../lib/url-safety";

test("only public http(s) URLs may be fetched or opened by the agent", () => {
  for (const ok of ["https://jobs.lever.co/acme/123", "http://example.com/careers", "https://8.8.8.8/x"]) expect(isPublicHttpUrl(ok), ok).toBe(true);
  for (const bad of [
    "file:///C:/Users/me/.ssh/id_rsa",
    "javascript:alert(1)",
    "http://localhost:3000/api/profile",
    "http://localhost./api/profile",
    "http://127.0.0.1:3000",
    "http://127.1/",
    "http://2130706433/",
    "http://192.168.1.10/admin",
    "http://10.0.0.5",
    "http://172.20.1.1",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]:3000",
    "http://[::ffff:127.0.0.1]/",
    "http://router.local",
    "not a url",
  ])
    expect(isPublicHttpUrl(bad), bad).toBe(false);
});

test("private, loopback and mapped addresses are recognised", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.31.0.1", "192.168.0.10", "169.254.1.1", "100.64.0.1", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1"])
    expect(isPrivateAddress(ip), ip).toBe(true);
  for (const ip of ["8.8.8.8", "151.101.1.69", "2606:4700::1111"]) expect(isPrivateAddress(ip), ip).toBe(false);
});

test("hostnames that are not public targets are refused before any request", async () => {
  expect(await isPublicHttpTarget("http://localhost:3000/api/profile")).toBe(false);
  expect(await isPublicHttpTarget("http://[::1]/")).toBe(false);
  expect(await isPublicHttpTarget("https://this-host-does-not-exist.invalid/job")).toBe(false);
});

test("the local API rejects requests a remote page could send", () => {
  expect(rejectRequest("POST", "127.0.0.1:3000", "http://127.0.0.1:3000", "same-origin")).toBeNull();
  expect(rejectRequest("GET", "localhost:3000", null, "same-origin")).toBeNull();
  expect(rejectRequest("POST", "localhost:3000", null, null)).toBeNull();
  expect(rejectRequest("POST", "127.0.0.1:3000", "https://evil.example", "cross-site")).toMatch(/Cross/);
  expect(rejectRequest("POST", "127.0.0.1:3000", "https://evil.example", null)).toMatch(/Cross-origin/);
  expect(rejectRequest("POST", "127.0.0.1:3000", "null", null)).toMatch(/Cross-origin/);
  expect(rejectRequest("GET", "127.0.0.1:3000", null, "cross-site")).toMatch(/Cross-site/);
  expect(rejectRequest("GET", "attacker.example:3000", null, null)).toMatch(/localhost/);
});

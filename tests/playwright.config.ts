import { defineConfig, devices } from "@playwright/test";

// Runs against the deployed site by default; point SITE_URL elsewhere to check
// a deploy preview or a local dev server before shipping.
export default defineConfig({
  testDir: ".",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: process.env.SITE_URL || "https://rishika-m.com",
    // every run is recorded, so the same pass that asserts also produces the reel
    video: { mode: "on", size: { width: 1280, height: 800 } },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 800 },
    // this suite drives a real browser against production, so it would otherwise
    // be counted as a visitor and quietly skew the analytics it is meant to protect
    extraHTTPHeaders: { "x-no-track": "1" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

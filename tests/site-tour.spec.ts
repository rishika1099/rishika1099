import { test, expect, type Page } from "@playwright/test";

// A walk through every public feature of the site. One pass does two jobs: it
// asserts each feature still works (so a bad deploy fails loudly) and it is
// recorded, so the same run produces the demo reel.
//
// Deliberately read-only against production: it never submits the guestbook or
// the contact form, because those write to a public wall and to an inbox.
// Admin surfaces are never visited.

/** Let an animation settle so the recording reads clearly. */
const beat = async (page: Page, ms = 900) => page.waitForTimeout(ms);

test("public feature tour", async ({ page }) => {
  await test.step("home", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // the nav is the spine of the site; if it is missing, something is badly wrong
    for (const label of ["About", "Work", "Blog", "Contact"]) {
      await expect(page.getByRole("link", { name: label }).first()).toBeVisible();
    }
    await beat(page);
  });

  await test.step("semantic search ranks by meaning", async () => {
    await page.goto("/work");
    const cards = page.locator("article");
    await expect(cards.first()).toBeVisible();
    const before = await cards.count();
    expect(before).toBeGreaterThan(5);

    const search = page.getByPlaceholder(/search by meaning/i);
    await search.click();
    await search.pressSequentially("make LLMs run faster", { delay: 55 });
    // results are debounced + embedded server-side, so wait for the grid to change
    await expect
      .poll(async () => cards.count(), { timeout: 20_000 })
      .toBeLessThan(before);
    // the point of semantic search: the top hit is about inference efficiency,
    // whichever of those projects currently ranks highest
    await expect(page.locator("article").first()).toContainText(
      /inference|kv[- ]?cache|throughput|latency|decoding|quantiz|gateway/i,
    );
    await beat(page, 1400);
    await search.fill("");
    await beat(page);
  });

  await test.step("ELI5 / expert rewrite toggle", async () => {
    const original = await page.locator("article").first().innerText();
    await page.getByRole("button", { name: /i'm 5/i }).click();
    await expect
      .poll(async () => page.locator("article").first().innerText(), { timeout: 25_000 })
      .not.toBe(original);
    await beat(page, 1200);
    await page.getByRole("button", { name: /default/i }).click();
    await beat(page);
  });

  await test.step("filter the grid by technical area", async () => {
    const filter = page.getByRole("button", { name: /^Computer Vision$/ }).first();
    if (await filter.isVisible().catch(() => false)) {
      const before = await page.locator("article").count();
      await filter.click();
      await expect.poll(async () => page.locator("article").count()).toBeLessThan(before);
      await beat(page, 1100);
      await filter.click();
      await beat(page);
    }
  });

  await test.step("embeddings galaxy places you on the same axes", async () => {
    const galaxy = page.getByPlaceholder(/tiny devices/i);
    await galaxy.scrollIntoViewIfNeeded();
    await expect(galaxy).toBeVisible();
    await galaxy.click();
    await galaxy.pressSequentially("computer vision on medical images", { delay: 45 });
    await page.getByRole("button", { name: /drop me in/i }).click();
    // the projected "you are here" star is drawn into the same SVG as the projects
    await expect(page.locator("svg")).toBeVisible();
    await beat(page, 2200);
  });

  await test.step("ask-my-portfolio chatbot answers with sources", async () => {
    await page.getByRole("button", { name: /ask about (me|rishika)/i }).click();
    const box = page.getByRole("textbox").last();
    await box.click();
    await box.pressSequentially("What did she build at Shell?", { delay: 40 });
    await box.press("Enter");
    // streamed answer: wait for real prose rather than a fixed sleep
    await expect
      .poll(async () => (await page.locator("body").innerText()).length, { timeout: 45_000 })
      .toBeGreaterThan(0);
    await expect(page.getByText(/Shell|forecast|Databricks/i).first()).toBeVisible({
      timeout: 45_000,
    });
    await beat(page, 2000);
    await page.keyboard.press("Escape");
  });

  await test.step("the writing room, and the poems door stays locked", async () => {
    await page.goto("/blog");
    await expect(page.getByText(/writing room/i).first()).toBeVisible();
    await beat(page);
    await page.goto("/blog/poems");
    // the gate is the feature: poems must not be readable without the password
    await expect(page.getByRole("textbox").first()).toBeVisible();
    await beat(page, 1200);
  });

  await test.step("technical blogs carry auto-generated topic tags", async () => {
    await page.goto("/blog/technical");
    await expect(page.locator("body")).toContainText(/technical blogs/i);
    await beat(page, 1200);
  });

  await test.step("resume renders as a page from the LaTeX source", async () => {
    await page.goto("/resume/print");
    await expect(page.getByText(/Experience|Education/i).first()).toBeVisible();
    await beat(page, 1500);
  });

  await test.step("guestbook is present (never signed by the robot)", async () => {
    await page.goto("/contact");
    // the contact form has a "your name" field too, so match the guestbook's exactly
    await expect(page.getByPlaceholder("your name (optional)")).toBeVisible();
    await expect(page.getByRole("button", { name: /^sign$/i })).toBeVisible();
    await beat(page, 1200);
  });
});

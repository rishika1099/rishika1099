import { test, expect, type Locator, type Page } from "@playwright/test";

// A walk through every public feature of the site. One pass does two jobs: it
// asserts each feature still works (so a bad deploy fails loudly) and it is
// recorded, so the same run produces the demo reel.
//
// Deliberately read-only against production: it never submits the guestbook or
// the contact form, because those write to a public wall and to an inbox.
// Admin surfaces are never visited.

/** Let an animation settle so the recording reads clearly. */
const beat = async (page: Page, ms = 900) => page.waitForTimeout(ms);

/**
 * The text as it settles, not as it first paints.
 *
 * The card descriptions are rewritten to fill the card, and on a cold cache
 * that rewrite lands a moment after the page does. Snapshotting too early
 * captures the raw readme line, and the round trip below then compares the
 * filled version against a string the page will never show again: the run that
 * caught this was waiting for an intruder-detection blurb that had been
 * rewritten while the test was reading it.
 */
async function settled(locator: Locator, quietFor = 1500, timeout = 60_000) {
  const started = Date.now();
  let last = await locator.innerText();
  let lastChange = Date.now();
  while (Date.now() - started < timeout) {
    await locator.page().waitForTimeout(300);
    const now = await locator.innerText();
    if (now !== last) {
      last = now;
      lastChange = Date.now();
    } else if (Date.now() - lastChange >= quietFor) {
      break;
    }
  }
  return last;
}

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
    // compare the blurb itself, not the whole card: the name, chips and links
    // never change, so comparing them only adds noise
    const blurb = page.locator("article").first().locator("p, span.rich-passage").first();
    const original = await settled(blurb);
    await page.getByRole("button", { name: /i'm 5/i }).click();
    // one batched rewrite for every project; the first ever call for a given
    // project set is a real LLM round trip before it is cached for good
    await expect.poll(async () => blurb.innerText(), { timeout: 90_000 }).not.toBe(original);
    await beat(page, 1200);
    await page.getByRole("button", { name: /default/i }).click();
    await expect.poll(async () => blurb.innerText(), { timeout: 30_000 }).toBe(original);
    await beat(page);
  });

  await test.step("projects grouped into shelves by area", async () => {
    const areas = page.locator('section[id^="area-"]');
    await expect(areas.first()).toBeVisible();
    expect(await areas.count()).toBeGreaterThan(4);
    // each area is a shelf carrying all of its projects, with position dots
    const firstShelf = areas.first();
    await firstShelf.scrollIntoViewIfNeeded();
    await expect(firstShelf.locator('button[aria-label^="go to project"]').first()).toBeVisible();
    await beat(page, 1200);
  });

  await test.step("the patch tabs jump between areas", async () => {
    // this was a <select> until the areas became tabs, one panel at a time
    const tabs = page.getByRole("tablist");
    await expect(tabs).toBeVisible();
    const cv = page.getByRole("tab", { name: /computer vision/i });
    await cv.click();
    await expect(cv).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#area-computer-vision")).toBeVisible();
    await beat(page, 1400);
  });

  await test.step("a domain filter narrows everything, and lets you back out", async () => {
    const before = await page.locator("article").count();
    await page.getByLabel("domain").selectOption("Healthcare");
    await expect.poll(async () => page.locator("article").count()).toBeLessThan(before);
    // the way back is the point: a filter you cannot clear is a trap
    const clear = page.getByRole("button", { name: /clear/i });
    await expect(clear).toBeVisible();
    await beat(page, 1200);
    await clear.click();
    // The grouped view comes back: the tabs return and the selected area shows
    // its shelf. Not the first section in the DOM, which is only the first tab:
    // an earlier step selected Computer Vision, and one panel shows at a time.
    await expect(page.getByRole("tablist")).toBeVisible();
    await expect(page.locator('section[id^="area-"]:visible').first()).toBeVisible();
    await beat(page);
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
    // Scoped to the chat panel, not the page. The answer has to be found inside
    // the thing that answered: matching page-wide picked up a project blurb
    // containing the word "forecast", found it hidden behind the panel, and
    // waited 45 seconds for a card to become visible. Naming the input also
    // means a panel that failed to open is a clear failure rather than a test
    // that quietly types its question into the project-idea box instead.
    const box = page.getByLabel(/ask about Rishika/i);
    const chat = page.locator("div.z-50").filter({ has: box });
    await box.click();
    await box.pressSequentially("What did she build at Shell?", { delay: 40 });
    await box.press("Enter");
    // streamed answer: wait for real prose rather than a fixed sleep
    await expect
      .poll(async () => (await chat.innerText()).length, { timeout: 45_000 })
      .toBeGreaterThan(0);
    await expect(chat.getByText(/Shell|forecast|Databricks/i).first()).toBeVisible({
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

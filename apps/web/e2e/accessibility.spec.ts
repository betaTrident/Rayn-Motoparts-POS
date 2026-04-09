import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function expectNoCriticalA11yViolations(page: Parameters<typeof test>[0]["page"]) {
  const scan = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();

  expect(scan.violations).toEqual([]);
}

test("login page has no basic accessibility violations", async ({ page }) => {
  await page.goto("/login");
  await expectNoCriticalA11yViolations(page);
});

test("unauthorized page has no basic accessibility violations", async ({ page }) => {
  await page.goto("/unauthorized");
  await expectNoCriticalA11yViolations(page);
});

test("404 page has no basic accessibility violations", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expectNoCriticalA11yViolations(page);
});

import { test, expect } from "@playwright/test";

test.describe("HealthMate AI Auth Flow", () => {
  test.beforeEach(({ page }) => {
    page.on("pageerror", (err) => {
      console.log("BROWSER_ERROR:", err.message);
    });
    page.on("console", (msg) => {
      console.log("BROWSER_LOG:", msg.text());
    });
  });

  test("should navigate to homepage and display the title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/HealthMate AI/);
  });

  test("should display login elements", async ({ page }) => {
    await page.goto("/login");
    await page.waitForTimeout(1000); // Give it a second to render
    await expect(page.locator("h1")).toContainText("Sign In");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });
});

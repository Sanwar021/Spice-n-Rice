import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(
  readFileSync("../.env", "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
test("public pages, filtering, responsive layout, accessibility", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of [
    "/",
    "/menu",
    "/catering",
    "/about",
    "/contact",
    "/missing",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator(".loading")).toHaveCount(0);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  }
  await page.goto("/menu");
  await page.getByRole("searchbox").fill("Butter Chicken");
  await expect(page.locator(".menu-item")).toHaveCount(1);
  await page.getByRole("button", { name: "Vegetarian", exact: true }).click();
  await expect(page.getByText("No dishes found.")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "../.local/home-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "../.local/home-desktop.png", fullPage: true });
});
test("admin login, device image upload, edit price, settings, logout", async ({
  page,
  context,
}) => {
  await page.goto("/admin");
  await page.getByLabel("Email", { exact: true }).fill(env.OWNER_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(env.OWNER_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await page.getByRole("button", { name: "Menu items", exact: true }).click();
  const price = page.getByRole("spinbutton", {
    name: "Price in cents for Butter Chicken",
    exact: true,
  });
  await expect(price).toBeVisible();
  const original = await price.inputValue();
  await price.fill(String(Number(original) + 1));
  await page
    .getByRole("button", { name: "Save price for Butter Chicken", exact: true })
    .click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await price.fill(original);
  await page
    .getByRole("button", { name: "Save price for Butter Chicken", exact: true })
    .click();
  const butterRow = page.getByRole("row").filter({ hasText: "Butter Chicken" });
  await butterRow.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Upload from device", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Upload menu item image from device")
    .setInputFiles("public/images/dish-1.jpg");
  const uploadedPreview = page.locator('.image-preview[src^="/uploads/"]');
  await expect(uploadedPreview).toBeVisible({ timeout: 20000 });
  const uploadedSrc = await uploadedPreview.getAttribute("src");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  const mediaResponse = await context.request.get("/api/v1/admin/media");
  expect(mediaResponse.ok()).toBe(true);
  const uploaded = (await mediaResponse.json()).find(
    (row: { image: string }) => row.image === uploadedSrc,
  );
  expect(uploaded).toBeTruthy();
  const removeResponse = await context.request.delete(
    `/api/v1/admin/media/${uploaded.id}`,
  );
  expect(removeResponse.ok()).toBe(true);
  await page
    .getByRole("button", { name: "Site settings", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit site settings" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
});

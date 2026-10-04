import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, writeFileSync } from "node:fs";

const base = "http://127.0.0.1:5175";
const widths = [320, 360, 375, 390, 414, 430, 480, 600, 768, 820, 900, 1024, 1280, 1366, 1440, 1600, 1920, 2560];
const routes = ["/", "/menu", "/catering", "/about", "/contact", "/missing"];
const orientations = [
  { width: 667, height: 375, name: "small-phone-landscape" },
  { width: 844, height: 390, name: "phone-landscape" },
  { width: 1024, height: 768, name: "tablet-landscape" },
  { width: 768, height: 1024, name: "tablet-portrait" },
];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const failures = [];
let checks = 0;

function record(type, details) {
  failures.push({ type, ...details });
}

async function inspect(page, label, route) {
  await page.locator("h1").waitFor();
  await page.locator(".loading").waitFor({ state: "detached" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
  const result = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const allowedScroll = (element) =>
      element.closest(".category-tabs,.featured-grid,.admin-sidebar nav,.table-wrap") !== null;
    const overflow = [...document.querySelectorAll("body *")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return !allowedScroll(element) && style.position !== "absolute" && rect.right > viewport + 2;
      })
      .slice(0, 8)
      .map((element) => ({ tag: element.tagName, className: String(element.className), right: Math.round(element.getBoundingClientRect().right) }));
    const brokenImages = [...document.images]
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src);
    const fixedOverlap = [...document.querySelectorAll("body *")]
      .filter((element) => {
        const style = getComputedStyle(element);
        if (!["fixed", "sticky"].includes(style.position) || style.visibility === "hidden") return false;
        const rect = element.getBoundingClientRect();
        return rect.width > innerWidth + 2 || rect.height > innerHeight + 2;
      })
      .map((element) => String(element.className));
    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewport,
      overflow,
      brokenImages,
      fixedOverlap,
    };
  });
  checks++;
  if (result.scrollWidth > result.viewport + 1 || result.overflow.length)
    record("overflow", { label, route, ...result });
  if (result.brokenImages.length) record("broken-images", { label, route, images: result.brokenImages });
  if (result.fixedOverlap.length) record("fixed-overlap", { label, route, elements: result.fixedOverlap });
}

for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, reducedMotion: "reduce", hasTouch: width <= 1024, isMobile: width <= 600 });
  const page = await context.newPage();
  const runtime = [];
  page.on("pageerror", (error) => runtime.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") runtime.push(message.text()); });
  for (const route of routes) {
    await page.goto(base + route);
    await inspect(page, `${width}px`, route);
  }
  if (runtime.length) record("runtime", { label: `${width}px`, messages: [...new Set(runtime)] });
  await context.close();
}

for (const viewport of orientations) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce", hasTouch: true, isMobile: viewport.width < 700 });
  const page = await context.newPage();
  for (const route of routes) {
    await page.goto(base + route);
    await inspect(page, viewport.name, route);
  }
  await context.close();
}

for (const theme of ["light", "dark"]) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", colorScheme: theme });
  const page = await context.newPage();
  await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
  for (const route of routes) {
    await page.goto(base + route);
    await page.locator("h1").waitFor();
    const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    checks++;
    if (scan.violations.length)
      record("accessibility", { theme, route, violations: scan.violations.map((v) => ({ id: v.id, targets: v.nodes.slice(0, 5).map((n) => n.target) })) });
  }
  await context.close();
}

const interaction = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
await interaction.goto(base + "/");
await interaction.getByRole("button", { name: "Toggle menu" }).click();
await interaction.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Menu", exact: true }).click();
await interaction.waitForURL("**/menu");
await interaction.getByRole("searchbox").fill("Butter Chicken");
await interaction.locator(".menu-item").first().click();
await interaction.getByRole("dialog").waitFor();
await interaction.keyboard.press("Escape");
if (await interaction.getByRole("dialog").count()) record("interaction", { message: "Menu dialog did not close with Escape" });
checks += 4;
await interaction.close();

const env = Object.fromEntries(readFileSync("../.env", "utf8").split(/\r?\n/).filter(Boolean).map((line) => { const at = line.indexOf("="); return [line.slice(0, at), line.slice(at + 1)]; }));
const adminContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const admin = await adminContext.newPage();
await admin.goto(base + "/admin");
await admin.getByLabel("Email", { exact: true }).fill(env.OWNER_EMAIL);
await admin.getByLabel("Password", { exact: true }).fill(env.OWNER_PASSWORD);
await admin.getByRole("button", { name: "Sign in", exact: true }).click();
await admin.getByRole("heading", { name: "Overview", exact: true }).waitFor();
for (const width of [320, 360, 390, 430, 600, 768, 820, 1024, 1366, 1920]) {
  await admin.setViewportSize({ width, height: width < 600 ? 844 : 900 });
  for (const section of ["Overview", "Menu items", "Categories", "Catering", "Price history", "Inbox", "Media library", "Testimonials", "Site settings"]) {
    await admin.getByRole("button", { name: section, exact: true }).click();
    await admin.getByRole("heading", { name: section, exact: true }).waitFor();
    const overflow = await admin.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    checks++;
    if (overflow) record("admin-overflow", { width, section });
  }
}
await admin.getByRole("button", { name: "Sign out" }).click();
await adminContext.close();

writeFileSync("../.local/responsive-audit.json", JSON.stringify({ failures, checks }, null, 2));
console.log(JSON.stringify({ failures, checks }, null, 2));
await browser.close();
if (failures.length) process.exitCode = 1;

import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
await page.goto("http://127.0.0.1:5175");
await page.locator("h1").waitFor();
await page.screenshot({ path: "../.local/home-mobile.png", fullPage: true });
console.log(
  await page.evaluate(() =>
    Array.from(document.querySelectorAll("body *"))
      .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
      .map((e) => ({
        tag: e.tagName,
        class: e.className,
        right: e.getBoundingClientRect().right,
      }))
      .slice(0, 20),
  ),
);
await page.setViewportSize({ width: 1440, height: 1000 });
await page.screenshot({ path: "../.local/home-desktop.png", fullPage: true });
await browser.close();

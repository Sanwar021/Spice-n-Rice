import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
const page = await context.newPage();
const results = [];
for (const route of ["/", "/menu", "/catering", "/about", "/contact"]) {
  await page.goto("http://127.0.0.1:5175" + route);
  await page.locator("h1").waitFor();
  const small = await page.evaluate(() => [...document.querySelectorAll("button,input:not([type=hidden]),select,textarea")]
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0 && (rect.width < 40 || rect.height < 40);
    })
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return { tag: element.tagName, className: String(element.className), label: element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 45), width: Math.round(rect.width), height: Math.round(rect.height) };
    }));
  if (small.length) results.push({ route, small });
}
console.log(JSON.stringify(results, null, 2));
await browser.close();
if (results.length) process.exitCode = 1;

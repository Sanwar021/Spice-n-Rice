import { chromium } from "../frontend/node_modules/@playwright/test/index.mjs";
import { mkdirSync, writeFileSync } from "node:fs";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const responses = [];
page.on("response", async (response) => {
  const type = response.headers()["content-type"] || "";
  if (type.includes("json")) responses.push(response.url());
});
await page.goto("https://spicenriceharun.menufy.com/#categoryHeading-6034", {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await page.waitForTimeout(12000);
mkdirSync(".local", { recursive: true });
writeFileSync(".local/menufy.html", await page.content());
writeFileSync(".local/menufy.txt", await page.locator("body").innerText());
writeFileSync(".local/menufy-json-responses.json", JSON.stringify(responses, null, 2));
const menuUrl = responses.find((url) => url.includes("/categories/all"));
if (!menuUrl) throw new Error("Menufy menu response was not found");
const menuResponse = await fetch(menuUrl);
if (!menuResponse.ok) throw new Error(`Menufy menu request failed: ${menuResponse.status}`);
writeFileSync(".local/menufy-menu.json", JSON.stringify(await menuResponse.json(), null, 2));
await page.screenshot({ path: ".local/menufy.png", fullPage: true });
console.log(JSON.stringify({ title: await page.title(), textLength: (await page.locator("body").innerText()).length, responses }, null, 2));
await browser.close();

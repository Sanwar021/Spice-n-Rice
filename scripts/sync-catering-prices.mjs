import { readFileSync, writeFileSync } from "node:fs";

// Menufy publishes entree prices rather than tray prices. Apply each verified
// per-serving increase to ten servings for a full tray and five for a half tray.
const prices = {
  "Veg Biriyani": [13000, 6500], "Chicken Biriyani": [14000, 7000], "Chicken Biriyani (Boneless)": [16000, 8000],
  "Goat Kacchi": [21000, 10500], "Beef Biriyani": [17000, 8500],
  "Chicken Karahi": [17000, 8500], "Chicken Korma": [17000, 8500], "Butter Chicken": [19000, 9500],
  "Chicken 65": [19000, 9500], "Chicken Roast (60pc / 30pc)": [18000, 9000], "Goat Karahi": [21000, 10500],
  "Goat Korma": [21000, 10500], Haleem: [18000, 9000],
  "Paneer Masala": [15000, 7500], "Muttar Paneer": [13000, 6500], "Saag Paneer": [13000, 6500],
  "Mix Veg": [13000, 6500], "Aloo Gobi": [13000, 6500], "Chana Masala": [13000, 6500], "Bhuna Dal": [13000, 6500],
  "Malai Kofta": [13000, 6500], "Shrimp Curry": [25000, 12500],
  "Tandoori Chicken": [750, 0], "Chicken Shish Kabab": [21000, 10500], "Chicken Boti": [21000, 10500], "Beef Shish Kebab": [21000, 10500],
};

const env = Object.fromEntries(readFileSync(".env", "utf8").split(/\r?\n/).filter(Boolean).map((line) => {
  const at = line.indexOf("="); return [line.slice(0, at), line.slice(at + 1)];
}));
const api = "http://127.0.0.1:8087/api/v1";
const login = await fetch(api + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: env.OWNER_EMAIL, password: env.OWNER_PASSWORD }) });
if (!login.ok) throw new Error(`Local admin login failed (${login.status})`);
const cookie = login.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
const headers = { Cookie: cookie, "Content-Type": "application/json" };
const items = await fetch(api + "/admin/catering", { headers }).then((response) => response.json());
const mapped = items.filter((item) => !item.deleted_at && prices[item.name]).map((item) => {
  const [price_cents, half_price_cents] = prices[item.name];
  return { item, id: item.id, name: item.name, old_full_cents: item.price_cents, new_full_cents: price_cents, old_half_cents: item.half_price_cents, new_half_cents: half_price_cents };
});
if (mapped.length !== Object.keys(prices).length) throw new Error(`Expected ${Object.keys(prices).length} catering products but found ${mapped.length}`);
const changed = mapped.filter((row) => row.old_full_cents !== row.new_full_cents || row.old_half_cents !== row.new_half_cents);
for (const row of changed) {
  const response = await fetch(`${api}/admin/catering/${row.id}`, { method: "PUT", headers, body: JSON.stringify({ ...row.item, price_cents: row.new_full_cents, half_price_cents: row.new_half_cents }) });
  if (!response.ok) throw new Error(`Failed to update ${row.name}: ${response.status}`);
}
await fetch(api + "/auth/logout", { method: "POST", headers: { Cookie: cookie } });
const report = { source: "https://spicenriceharun.menufy.com/#categoryHeading-6034", method: "verified entree increase × 10 full tray / × 5 half tray; Tandoori derived per piece", checked_at: new Date().toISOString(), mapped_products: mapped.length, changed_products: changed.map(({ item, ...row }) => row) };
writeFileSync(".local/catering-price-sync.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

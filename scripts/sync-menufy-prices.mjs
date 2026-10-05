import { readFileSync, writeFileSync } from "node:fs";

const prices = {
  Biriyanis: { Vegetable: 1099, Chicken: 1199, "Chicken (Boneless)": 1399, Goat: 1599, "Goat Kacchi": 1699, Beef: 1499, "Beef Tehari": 1399, Shrimp: 1599 },
  "Non-Veg": { "Chicken Karahi": 1499, "Chicken Korma": 1499, "Chicken Korma (Boneless)": 1599, "Buttered Chicken": 1499, "Chicken 65": 1499, "Chicken Roast": 1499, "Mezbani Beef Curry": 1499, Haleem: 1299, "Goat Karahi": 1599, "Goat Korma": 1599 },
  Grilled: { "Tandoori Chicken Leg (2 pieces)": 1499, "Chicken Boti": 1499, "Chicken Shish Kabab": 1499, "Beef Boti": 1599, "Beef Shish Kabab": 1499, "Mixed Grill": 2099 },
  "Naan Wraps": { "Paneer Wrap": 899, "Chicken Boti Wrap": 899, "Beef Kabab Wrap": 899, "Gyro Wrap": 899, "Gyro Combo": 1099 },
  Veg: { "Saag Paneer": 1399, "Paneer Masala": 1399, "Muttar Paneer": 1399, "Mixed Vegetable": 1199, "Navratan Korma": 1199, "Aloo Gobi": 1199, "Chana Masala": 1199, "Bhuna Daal": 1199, "Malai Vegetable Kofta": 1199 },
  Fish: { "Ruhi Fish Curry": 1699, "Whole Tilapia Fish Curry": 1599, "Hilsha Fish Curry": 1999, "Pomphret Curry or Fry": 1699, "Shrimp Curry": 1699, "Shrimp Malai Curry": 1699 },
  Snacketizers: { "Vegetable Samosa (each)": 199, "Daal Puri (5pc)": 599 },
  Sides: { Naan: 199, "Garlic Naan": 299, "Paratha (2 Pieces)": 399 },
  "Children’s": { "Chicken Nuggets with Fries": 699, "Chicken Tenders (5)": 799 },
  Beverages: { "Soft Drinks (can)": 199, "Bottled Water": 199, "Masala Tea": 149, Lassi: 399 },
};

const env = Object.fromEntries(readFileSync(".env", "utf8").split(/\r?\n/).filter(Boolean).map((line) => {
  const at = line.indexOf("=");
  return [line.slice(0, at), line.slice(at + 1)];
}));
const api = "http://127.0.0.1:8087/api/v1";
const login = await fetch(api + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: env.OWNER_EMAIL, password: env.OWNER_PASSWORD }) });
if (!login.ok) throw new Error(`Local admin login failed (${login.status})`);
const cookie = login.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
const headers = { Cookie: cookie, "Content-Type": "application/json" };
const [items, categories] = await Promise.all([
  fetch(api + "/admin/items", { headers }).then((response) => response.json()),
  fetch(api + "/admin/categories", { headers }).then((response) => response.json()),
]);
const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
const targets = Object.values(prices).reduce((count, group) => count + Object.keys(group).length, 0);
const matched = [];
for (const item of items.filter((row) => !row.deleted_at)) {
  const category = categoryNames.get(item.category_id);
  const price = prices[category]?.[item.name];
  if (price === undefined) continue;
  matched.push({ id: item.id, category, name: item.name, old_cents: item.price_cents, new_cents: price });
}
if (matched.length !== targets) throw new Error(`Expected ${targets} mapped products but found ${matched.length}`);
for (const change of matched.filter((row) => row.old_cents !== row.new_cents)) {
  const item = items.find((row) => row.id === change.id);
  const response = await fetch(`${api}/admin/items/${change.id}`, { method: "PUT", headers, body: JSON.stringify({ ...item, price_cents: change.new_cents }) });
  if (!response.ok) throw new Error(`Failed to update ${change.category} / ${change.name}: ${response.status}`);
}
await fetch(api + "/auth/logout", { method: "POST", headers: { Cookie: cookie } });
const report = { source: "https://spicenriceharun.menufy.com/#categoryHeading-6034", checked_at: new Date().toISOString(), mapped_products: matched.length, changed_products: matched.filter((row) => row.old_cents !== row.new_cents) };
writeFileSync(".local/menufy-price-sync.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

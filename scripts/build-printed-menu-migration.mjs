import { readFileSync, writeFileSync } from "node:fs";

// Generate once when updating the owner-supplied menu, not during app startup.
const menu = JSON.parse(readFileSync(new URL("./printed-menu.json", import.meta.url), "utf8"));
const quote = (value) => "'" + value.replaceAll("'", "''") + "'";
const prices = Object.entries(menu.groups).flatMap(([category, items]) =>
  Object.entries(items).map(([name, price]) => `(${quote(category)},${quote(name)},${price})`),
).join(",\n");
const images = menu.images.map(([category, name, asset]) =>
  `(${quote(category)},${quote(name)},${quote(`/images/menu-printed/${asset}.webp`)})`,
).join(",\n");
const sql = `-- Source: restaurant owner's three printed menu photos, 2026-10-05.
-- Preserve existing names and all catering prices. Snapshot permits rollback.
BEGIN;
CREATE TABLE printed_menu_20261005_backup AS
SELECT id, price_cents, data FROM menu_items WHERE deleted_at IS NULL;
CREATE TABLE printed_menu_20261005_added (id bigint PRIMARY KEY);
CREATE TABLE printed_menu_20261005_media (id bigint PRIMARY KEY);

CREATE TEMP TABLE printed_prices(category_name text,item_name text,price_cents integer) ON COMMIT DROP;
INSERT INTO printed_prices VALUES
${prices};

INSERT INTO price_history(resource,item_id,field,old_cents,new_cents)
SELECT 'items',item.id,'price_cents',item.price_cents,p.price_cents
FROM menu_items item JOIN categories c ON c.id=item.category_id
JOIN printed_prices p ON p.category_name=c.data->>'name' AND p.item_name=item.data->>'name'
WHERE item.deleted_at IS NULL AND item.price_cents<>p.price_cents;

UPDATE menu_items item SET price_cents=p.price_cents
FROM printed_prices p JOIN categories c ON c.data->>'name'=p.category_name
WHERE item.category_id=c.id AND item.data->>'name'=p.item_name
AND item.deleted_at IS NULL AND item.price_cents<>p.price_cents;

WITH added AS (
INSERT INTO menu_items(category_id,price_cents,data)
SELECT c.id,p.price_cents,jsonb_build_object(
 'name',p.item_name,'description',CASE p.item_name
 WHEN 'Morog Pulao' THEN 'Chicken pulao with fragrant rice and warming spices.'
 ELSE 'Slow-cooked beef with deeply roasted spices. Served with rice or naan.' END,
 'available',true,'veg',false,'spicy',false,'featured',false,'image','',
 'sort_order',CASE p.item_name WHEN 'Morog Pulao' THEN 8 ELSE 11 END)
FROM printed_prices p JOIN categories c ON c.data->>'name'=p.category_name
WHERE p.item_name IN ('Morog Pulao','Kala Bhuna') AND NOT EXISTS (
 SELECT 1 FROM menu_items i WHERE i.category_id=c.id AND i.data->>'name'=p.item_name AND i.deleted_at IS NULL)
RETURNING id
) INSERT INTO printed_menu_20261005_added SELECT id FROM added;

WITH images(category_name,item_name,url) AS (VALUES
${images}
)
UPDATE menu_items item SET data=jsonb_set(item.data,'{image}',to_jsonb(images.url))
FROM images JOIN categories c ON c.data->>'name'=images.category_name
WHERE item.category_id=c.id AND item.data->>'name'=images.item_name AND item.deleted_at IS NULL;

WITH assets(name,url) AS (VALUES
${[...new Set(menu.images.map((row) => row[2])), "fish"].map((asset) => `(${quote(`Printed menu — ${asset.replaceAll("-", " ")}`)},${quote(`/images/menu-printed/${asset}.webp`)})`).join(",\n")},
('Restaurant interior — enhanced','/images/restaurant-interior.webp')
), added AS (
 INSERT INTO media(data)
 SELECT jsonb_build_object('name',name,'image',url,'thumbnail',url)
 FROM assets WHERE NOT EXISTS (SELECT 1 FROM media WHERE data->>'image'=assets.url AND deleted_at IS NULL)
 RETURNING id
) INSERT INTO printed_menu_20261005_media SELECT id FROM added;
COMMIT;
`;
writeFileSync(new URL("../backend/migrations/000009_printed_menu.up.sql", import.meta.url), sql);
writeFileSync(new URL("../backend/migrations/000009_printed_menu.down.sql", import.meta.url), `BEGIN;
UPDATE menu_items item SET price_cents=b.price_cents,data=b.data
FROM printed_menu_20261005_backup b WHERE item.id=b.id;
DELETE FROM menu_items WHERE id IN (SELECT id FROM printed_menu_20261005_added);
DELETE FROM media WHERE id IN (SELECT id FROM printed_menu_20261005_media);
DROP TABLE printed_menu_20261005_media;
DROP TABLE printed_menu_20261005_added;
DROP TABLE printed_menu_20261005_backup;
COMMIT;
`);
console.log(`Generated migration for ${Object.values(menu.groups).reduce((n, group) => n + Object.keys(group).length, 0)} printed menu prices and ${menu.images.length} image mappings.`);

-- Source: restaurant owner's three printed menu photos, 2026-10-05.
-- Preserve existing names and all catering prices. Snapshot permits rollback.
BEGIN;
CREATE TABLE printed_menu_20261005_backup AS
SELECT id, price_cents, data FROM menu_items WHERE deleted_at IS NULL;
CREATE TABLE printed_menu_20261005_added (id bigint PRIMARY KEY);
CREATE TABLE printed_menu_20261005_media (id bigint PRIMARY KEY);

CREATE TEMP TABLE printed_prices(category_name text,item_name text,price_cents integer) ON COMMIT DROP;
INSERT INTO printed_prices VALUES
('Biriyanis','Vegetable',1099),
('Biriyanis','Chicken',1199),
('Biriyanis','Chicken (Boneless)',1399),
('Biriyanis','Goat',1699),
('Biriyanis','Goat Kacchi',1699),
('Biriyanis','Beef',1599),
('Biriyanis','Beef Tehari',1599),
('Biriyanis','Shrimp',1699),
('Biriyanis','Morog Pulao',1199),
('Non-Veg','Chicken Karahi',1499),
('Non-Veg','Chicken Karahi (Boneless)',1599),
('Non-Veg','Chicken Korma',1499),
('Non-Veg','Chicken Korma (Boneless)',1599),
('Non-Veg','Buttered Chicken',1499),
('Non-Veg','Chicken 65',1499),
('Non-Veg','Chicken Roast',1499),
('Non-Veg','Kala Bhuna',1599),
('Non-Veg','Mezbani Beef Curry',1499),
('Non-Veg','Haleem',1299),
('Non-Veg','Goat Karahi',1599),
('Non-Veg','Goat Korma',1599),
('Grilled','Tandoori Chicken Leg (2 pieces)',1499),
('Grilled','Chicken Boti',1499),
('Grilled','Chicken Shish Kabab',1499),
('Grilled','Beef Boti',1599),
('Grilled','Beef Shish Kabab',1499),
('Grilled','Mixed Grill',2099),
('Naan Wraps','Paneer Wrap',899),
('Naan Wraps','Chicken Boti Wrap',899),
('Naan Wraps','Chicken Kebab',899),
('Naan Wraps','Beef Kabab Wrap',899),
('Naan Wraps','Gyro Wrap',899),
('Naan Wraps','Gyro Combo',1099),
('Veg','Saag Paneer',1399),
('Veg','Paneer Masala',1399),
('Veg','Muttar Paneer',1399),
('Veg','Mixed Vegetable',1199),
('Veg','Navratan Korma',1199),
('Veg','Aloo Gobi',1199),
('Veg','Chana Masala',1199),
('Veg','Bhuna Daal',1199),
('Veg','Malai Vegetable Kofta',1199),
('Fish','Ruhi Fish Curry',1699),
('Fish','Whole Tilapia Fish Curry',1599),
('Fish','Hilsha Fish Curry',1999),
('Fish','Pomphret Curry or Fry',1699),
('Fish','Shrimp Curry',1699),
('Fish','Shrimp Malai Curry',1699),
('Snacketizers','Vegetable Samosa (each)',199),
('Snacketizers','Chicken Samosa (each)',149),
('Snacketizers','Kolija Samosa (2pc)',500),
('Snacketizers','Beef Samosa (each)',149),
('Snacketizers','Potato Cutlet (each)',149),
('Snacketizers','Chicken Wings (6pc)',599),
('Snacketizers','Daal Puri (5pc)',599),
('Snacketizers','Samosa Chaat',699),
('Snacketizers','Tikki Chaat',699),
('Snacketizers','Chole Bhatura',1099),
('Sides','Steamed Rice',199),
('Sides','Pulao Rice',199),
('Sides','Khichuri Rice',299),
('Sides','Naan',199),
('Sides','Garlic Naan',299),
('Sides','Paratha (2 Pieces)',399),
('Children’s','Chicken Nuggets with Fries',699),
('Children’s','Chicken Tenders (5)',799),
('Beverages','Soft Drinks (can)',199),
('Beverages','Bottled Water',199),
('Beverages','Masala Tea',149),
('Beverages','Lassi',399);

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
('Biriyanis','Chicken','/images/menu-printed/biryani.webp'),
('Snacketizers','Vegetable Samosa (each)','/images/menu-printed/samosa.webp'),
('Beverages','Masala Tea','/images/menu-printed/chai.webp'),
('Sides','Naan','/images/menu-printed/naan.webp'),
('Sides','Garlic Naan','/images/menu-printed/garlic-naan.webp'),
('Children’s','Chicken Tenders (5)','/images/menu-printed/chicken-tenders.webp'),
('Naan Wraps','Chicken Boti Wrap','/images/menu-printed/chicken-wrap.webp'),
('Grilled','Chicken Shish Kabab','/images/menu-printed/seekh-kabab.webp'),
('Grilled','Beef Shish Kabab','/images/menu-printed/seekh-kabab.webp'),
('Non-Veg','Chicken Karahi','/images/menu-printed/chicken-karahi.webp'),
('Non-Veg','Chicken Karahi (Boneless)','/images/menu-printed/chicken-karahi.webp'),
('Veg','Aloo Gobi','/images/menu-printed/vegetables.webp')
)
UPDATE menu_items item SET data=jsonb_set(item.data,'{image}',to_jsonb(images.url))
FROM images JOIN categories c ON c.data->>'name'=images.category_name
WHERE item.category_id=c.id AND item.data->>'name'=images.item_name AND item.deleted_at IS NULL;

WITH assets(name,url) AS (VALUES
('Printed menu — biryani','/images/menu-printed/biryani.webp'),
('Printed menu — samosa','/images/menu-printed/samosa.webp'),
('Printed menu — chai','/images/menu-printed/chai.webp'),
('Printed menu — naan','/images/menu-printed/naan.webp'),
('Printed menu — garlic naan','/images/menu-printed/garlic-naan.webp'),
('Printed menu — chicken tenders','/images/menu-printed/chicken-tenders.webp'),
('Printed menu — chicken wrap','/images/menu-printed/chicken-wrap.webp'),
('Printed menu — seekh kabab','/images/menu-printed/seekh-kabab.webp'),
('Printed menu — chicken karahi','/images/menu-printed/chicken-karahi.webp'),
('Printed menu — vegetables','/images/menu-printed/vegetables.webp'),
('Printed menu — fish','/images/menu-printed/fish.webp'),
('Restaurant interior — enhanced','/images/restaurant-interior.webp')
), added AS (
 INSERT INTO media(data)
 SELECT jsonb_build_object('name',name,'image',url,'thumbnail',url)
 FROM assets WHERE NOT EXISTS (SELECT 1 FROM media WHERE data->>'image'=assets.url AND deleted_at IS NULL)
 RETURNING id
) INSERT INTO printed_menu_20261005_media SELECT id FROM added;
COMMIT;

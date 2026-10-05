WITH names(category_name,old_name,new_name) AS (VALUES
('Non-Veg','Chicken Karma','Chicken Korma'),
('Non-Veg','Chicken Karma (Boneless)','Chicken Korma (Boneless)'),
('Non-Veg','Butter Chicken','Buttered Chicken'),
('Non-Veg','Chicken 65 (Dry/Wet)','Chicken 65'),
('Non-Veg','Haleem (Beef)','Haleem'),
('Grilled','Tandoori Chicken (2pcs)','Tandoori Chicken Leg (2 pieces)'),
('Grilled','Chicken Sheekh Kabab','Chicken Shish Kabab'),
('Grilled','Beef Sheekh Kabab','Beef Shish Kabab'),
('Grilled','Mix Grill','Mixed Grill'),
('Naan Wraps','Paneer','Paneer Wrap'),
('Naan Wraps','Chicken Boti','Chicken Boti Wrap'),
('Naan Wraps','Beef Kabab','Beef Kabab Wrap'),
('Veg','Mixed Vegetables','Mixed Vegetable'),
('Fish','Pompret Curry or Fry','Pomphret Curry or Fry'),
('Snacketizers','Vegetable Samosa','Vegetable Samosa (each)'),
('Snacketizers','Chicken Samosa','Chicken Samosa (each)'),
('Snacketizers','Beef Samosa','Beef Samosa (each)'),
('Snacketizers','Potato Cutlet','Potato Cutlet (each)'),
('Sides','Paratha (2pc)','Paratha (2 Pieces)'),
('Children’s','Chicken Tenders (5pc)','Chicken Tenders (5)'),
('Beverages','Soft Drinks','Soft Drinks (can)'),
('Beverages','Masala Tea/Chai','Masala Tea'),
('Beverages','Lassi (Mango/Sweet/Salt)','Lassi')
)
UPDATE menu_items item SET data=jsonb_set(jsonb_set(item.data,'{name}',to_jsonb(names.new_name::text)),'{description}',to_jsonb(replace(COALESCE(item.data->>'description',''),names.old_name,names.new_name))),updated_at=now()
FROM names JOIN categories category ON category.data->>'name'=names.category_name
WHERE item.category_id=category.id AND item.data->>'name'=names.old_name AND item.deleted_at IS NULL;

WITH names(old_name,new_name) AS (VALUES
('Veg Biriyani','Vegetable Biriyani'),('Butter Chicken','Buttered Chicken'),
('Mix Veg','Mixed Vegetable'),('Bhuna Dal','Bhuna Daal'),('Malai Kofta','Malai Vegetable Kofta'),
('Polao Rice','Pulao Rice'),('Steam Rice','Steamed Rice'),('Beef Shish Kebab','Beef Shish Kabab')
)
UPDATE catering_items item SET data=jsonb_set(item.data,'{name}',to_jsonb(names.new_name::text)),updated_at=now()
FROM names WHERE item.data->>'name'=names.old_name AND item.deleted_at IS NULL;

UPDATE menu_items SET data=jsonb_set(data,'{description}',to_jsonb('Available dry or wet.'::text)) WHERE data->>'name'='Chicken 65';
UPDATE menu_items SET data=jsonb_set(data,'{description}',to_jsonb('Choose sweet, salty, or mango.'::text)) WHERE data->>'name'='Lassi';
UPDATE catering_items SET data=jsonb_set(data,'{section}','"Non-Veg"'::jsonb) WHERE data->>'name'='Shrimp Curry' AND data->>'section'='Veg';
UPDATE catering_items SET data=jsonb_set(data,'{section}','"Biriyani"'::jsonb) WHERE data->>'section'='Biryani';
UPDATE categories SET data=jsonb_set(data,'{name}','"Biriyanis"'::jsonb) WHERE data->>'name'='Biryanis';
UPDATE settings SET data=jsonb_set(data,'{order_url}','"https://spicenriceharun.menufy.com/"'::jsonb) WHERE data->>'order_url' LIKE 'http://spicenriceharun.menufy.com%';

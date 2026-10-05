UPDATE settings SET data=jsonb_set(data,'{order_url}','"http://spicenriceharun.menufy.com"'::jsonb) WHERE data->>'order_url'='https://spicenriceharun.menufy.com/';
UPDATE categories SET data=jsonb_set(data,'{name}','"Biryanis"'::jsonb) WHERE data->>'name'='Biriyanis';
UPDATE catering_items SET data=jsonb_set(data,'{section}','"Biryani"'::jsonb) WHERE data->>'section'='Biriyani';
UPDATE catering_items SET data=jsonb_set(data,'{section}','"Veg"'::jsonb) WHERE data->>'name'='Shrimp Curry' AND data->>'section'='Non-Veg';
WITH names(old_name,new_name) AS (VALUES
('Veg Biriyani','Vegetable Biriyani'),('Butter Chicken','Buttered Chicken'),
('Mix Veg','Mixed Vegetable'),('Bhuna Dal','Bhuna Daal'),('Malai Kofta','Malai Vegetable Kofta'),
('Polao Rice','Pulao Rice'),('Steam Rice','Steamed Rice'),('Beef Shish Kebab','Beef Shish Kabab')
)
UPDATE catering_items item SET data=jsonb_set(item.data,'{name}',to_jsonb(names.old_name::text)),updated_at=now()
FROM names WHERE item.data->>'name'=names.new_name AND item.deleted_at IS NULL;
WITH names(category_name,old_name,new_name) AS (VALUES
('Non-Veg','Chicken Karma','Chicken Korma'),('Non-Veg','Chicken Karma (Boneless)','Chicken Korma (Boneless)'),('Non-Veg','Butter Chicken','Buttered Chicken'),('Non-Veg','Chicken 65 (Dry/Wet)','Chicken 65'),('Non-Veg','Haleem (Beef)','Haleem'),
('Grilled','Tandoori Chicken (2pcs)','Tandoori Chicken Leg (2 pieces)'),('Grilled','Chicken Sheekh Kabab','Chicken Shish Kabab'),('Grilled','Beef Sheekh Kabab','Beef Shish Kabab'),('Grilled','Mix Grill','Mixed Grill'),
('Naan Wraps','Paneer','Paneer Wrap'),('Naan Wraps','Chicken Boti','Chicken Boti Wrap'),('Naan Wraps','Beef Kabab','Beef Kabab Wrap'),
('Veg','Mixed Vegetables','Mixed Vegetable'),('Fish','Pompret Curry or Fry','Pomphret Curry or Fry'),
('Snacketizers','Vegetable Samosa','Vegetable Samosa (each)'),('Snacketizers','Chicken Samosa','Chicken Samosa (each)'),('Snacketizers','Beef Samosa','Beef Samosa (each)'),('Snacketizers','Potato Cutlet','Potato Cutlet (each)'),
('Sides','Paratha (2pc)','Paratha (2 Pieces)'),('Children’s','Chicken Tenders (5pc)','Chicken Tenders (5)'),
('Beverages','Soft Drinks','Soft Drinks (can)'),('Beverages','Masala Tea/Chai','Masala Tea'),('Beverages','Lassi (Mango/Sweet/Salt)','Lassi')
)
UPDATE menu_items item SET data=jsonb_set(jsonb_set(item.data,'{name}',to_jsonb(names.old_name::text)),'{description}',to_jsonb(replace(COALESCE(item.data->>'description',''),names.new_name,names.old_name))),updated_at=now()
FROM names JOIN categories category ON category.data->>'name'=names.category_name
WHERE item.category_id=category.id AND item.data->>'name'=names.new_name AND item.deleted_at IS NULL;

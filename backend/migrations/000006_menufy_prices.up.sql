WITH prices(category_name,item_name,price_cents) AS (VALUES
('Biryanis','Vegetable',1099),('Biryanis','Chicken',1199),('Biryanis','Chicken (Boneless)',1399),('Biryanis','Goat',1599),('Biryanis','Goat Kacchi',1699),('Biryanis','Beef',1499),('Biryanis','Beef Tehari',1399),('Biryanis','Shrimp',1599),
('Non-Veg','Chicken Karahi',1499),('Non-Veg','Chicken Karma',1499),('Non-Veg','Chicken Karma (Boneless)',1599),('Non-Veg','Butter Chicken',1499),('Non-Veg','Chicken 65 (Dry/Wet)',1499),('Non-Veg','Chicken Roast',1499),('Non-Veg','Mezbani Beef Curry',1499),('Non-Veg','Haleem (Beef)',1299),('Non-Veg','Goat Karahi',1599),('Non-Veg','Goat Korma',1599),
('Grilled','Tandoori Chicken (2pcs)',1499),('Grilled','Chicken Boti',1499),('Grilled','Chicken Sheekh Kabab',1499),('Grilled','Beef Boti',1599),('Grilled','Beef Sheekh Kabab',1499),('Grilled','Mix Grill',2099),
('Naan Wraps','Paneer',899),('Naan Wraps','Chicken Boti',899),('Naan Wraps','Beef Kabab',899),('Naan Wraps','Gyro Wrap',899),('Naan Wraps','Gyro Combo',1099),
('Veg','Saag Paneer',1399),('Veg','Paneer Masala',1399),('Veg','Muttar Paneer',1399),('Veg','Mixed Vegetables',1199),('Veg','Navratan Korma',1199),('Veg','Aloo Gobi',1199),('Veg','Chana Masala',1199),('Veg','Bhuna Daal',1199),('Veg','Malai Vegetable Kofta',1199),
('Fish','Ruhi Fish Curry',1699),('Fish','Whole Tilapia Fish Curry',1599),('Fish','Hilsha Fish Curry',1999),('Fish','Pompret Curry or Fry',1699),('Fish','Shrimp Curry',1699),('Fish','Shrimp Malai Curry',1699),
('Snacketizers','Vegetable Samosa',199),('Snacketizers','Daal Puri (5pc)',599),
('Sides','Naan',199),('Sides','Garlic Naan',299),('Sides','Paratha (2pc)',399),
('Children’s','Chicken Nuggets with Fries',699),('Children’s','Chicken Tenders (5pc)',799),
('Beverages','Soft Drinks',199),('Beverages','Bottled Water',199),('Beverages','Masala Tea/Chai',149),('Beverages','Lassi (Mango/Sweet/Salt)',399)
)
UPDATE menu_items item SET price_cents=prices.price_cents,updated_at=now()
FROM prices JOIN categories category ON category.data->>'name'=prices.category_name
WHERE item.category_id=category.id AND item.data->>'name'=prices.item_name AND item.deleted_at IS NULL;

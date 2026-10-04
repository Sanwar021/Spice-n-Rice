WITH prices(category_name,item_name,price_cents) AS (VALUES
('Biryanis','Vegetable',999),('Biryanis','Chicken',1099),('Biryanis','Chicken (Boneless)',1299),('Biryanis','Goat',1599),('Biryanis','Goat Kacchi',1599),('Biryanis','Beef',1399),('Biryanis','Beef Tehari',1399),('Biryanis','Shrimp',1599),
('Non-Veg','Chicken Karahi',1399),('Non-Veg','Chicken Karma',1399),('Non-Veg','Chicken Karma (Boneless)',1499),('Non-Veg','Butter Chicken',1399),('Non-Veg','Chicken 65 (Dry/Wet)',1399),('Non-Veg','Chicken Roast',1399),('Non-Veg','Mezbani Beef Curry',1399),('Non-Veg','Haleem (Beef)',1099),('Non-Veg','Goat Karahi',1499),('Non-Veg','Goat Korma',1499),
('Grilled','Tandoori Chicken (2pcs)',1399),('Grilled','Chicken Boti',1399),('Grilled','Chicken Sheekh Kabab',1399),('Grilled','Beef Boti',1499),('Grilled','Beef Sheekh Kabab',1399),('Grilled','Mix Grill',1999),
('Naan Wraps','Paneer',799),('Naan Wraps','Chicken Boti',799),('Naan Wraps','Beef Kabab',799),('Naan Wraps','Gyro Wrap',799),('Naan Wraps','Gyro Combo',799),
('Veg','Saag Paneer',1299),('Veg','Paneer Masala',1299),('Veg','Muttar Paneer',1299),('Veg','Mixed Vegetables',1099),('Veg','Navratan Korma',1099),('Veg','Aloo Gobi',1099),('Veg','Chana Masala',1099),('Veg','Bhuna Daal',1099),('Veg','Malai Vegetable Kofta',1099),
('Fish','Ruhi Fish Curry',1599),('Fish','Whole Tilapia Fish Curry',1499),('Fish','Hilsha Fish Curry',1899),('Fish','Pompret Curry or Fry',1599),('Fish','Shrimp Curry',1599),('Fish','Shrimp Malai Curry',1599),
('Snacketizers','Vegetable Samosa',149),('Snacketizers','Daal Puri (5pc)',499),
('Sides','Naan',149),('Sides','Garlic Naan',199),('Sides','Paratha (2pc)',299),
('Children’s','Chicken Nuggets with Fries',599),('Children’s','Chicken Tenders (5pc)',699),
('Beverages','Soft Drinks',149),('Beverages','Bottled Water',149),('Beverages','Masala Tea/Chai',129),('Beverages','Lassi (Mango/Sweet/Salt)',299)
)
UPDATE menu_items item SET price_cents=prices.price_cents,updated_at=now()
FROM prices JOIN categories category ON category.data->>'name'=prices.category_name
WHERE item.category_id=category.id AND item.data->>'name'=prices.item_name AND item.deleted_at IS NULL;

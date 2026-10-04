WITH prices(item_name,full_cents,half_cents) AS (VALUES
('Veg Biriyani',13000,6500),('Chicken Biriyani',14000,7000),('Chicken Biriyani (Boneless)',16000,8000),('Goat Kacchi',21000,10500),('Beef Biriyani',17000,8500),
('Chicken Karahi',17000,8500),('Chicken Korma',17000,8500),('Butter Chicken',19000,9500),('Chicken 65',19000,9500),('Chicken Roast (60pc / 30pc)',18000,9000),('Goat Karahi',21000,10500),('Goat Korma',21000,10500),('Haleem',18000,9000),
('Paneer Masala',15000,7500),('Muttar Paneer',13000,6500),('Saag Paneer',13000,6500),('Mix Veg',13000,6500),('Aloo Gobi',13000,6500),('Chana Masala',13000,6500),('Bhuna Dal',13000,6500),('Malai Kofta',13000,6500),('Shrimp Curry',25000,12500),
('Tandoori Chicken',750,0),('Chicken Shish Kabab',21000,10500),('Chicken Boti',21000,10500),('Beef Shish Kebab',21000,10500)
)
UPDATE catering_items item SET price_cents=prices.full_cents,half_price_cents=prices.half_cents,updated_at=now()
FROM prices WHERE item.data->>'name'=prices.item_name AND item.deleted_at IS NULL;

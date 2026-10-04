WITH prices(item_name,full_cents,half_cents) AS (VALUES
('Veg Biriyani',12000,6000),('Chicken Biriyani',13000,6500),('Chicken Biriyani (Boneless)',15000,7500),('Goat Kacchi',20000,10000),('Beef Biriyani',16000,8000),
('Chicken Karahi',16000,8000),('Chicken Korma',16000,8000),('Butter Chicken',18000,9000),('Chicken 65',18000,9000),('Chicken Roast (60pc / 30pc)',17000,8500),('Goat Karahi',20000,10000),('Goat Korma',20000,10000),('Haleem',16000,8000),
('Paneer Masala',14000,7000),('Muttar Paneer',12000,6000),('Saag Paneer',12000,6000),('Mix Veg',12000,6000),('Aloo Gobi',12000,6000),('Chana Masala',12000,6000),('Bhuna Dal',12000,6000),('Malai Kofta',12000,6000),('Shrimp Curry',24000,12000),
('Tandoori Chicken',600,0),('Chicken Shish Kabab',20000,10000),('Chicken Boti',20000,10000),('Beef Shish Kebab',20000,10000)
)
UPDATE catering_items item SET price_cents=prices.full_cents,half_price_cents=prices.half_cents,updated_at=now()
FROM prices WHERE item.data->>'name'=prices.item_name AND item.deleted_at IS NULL;

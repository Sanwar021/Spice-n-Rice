UPDATE settings SET data=jsonb_set(data,'{hero_image}','"/images/food.webp"'::jsonb) WHERE data->>'hero_image'='/images/food.jpg';
INSERT INTO media(data) VALUES
('{"name":"Restaurant food","image":"/images/food.webp","thumbnail":"/images/food.webp"}'),
('{"name":"Original restaurant logo","image":"/images/original-logo.png","thumbnail":"/images/original-logo.png"}'),
('{"name":"Dining room","image":"/images/catering.jpg","thumbnail":"/images/catering.jpg"}'),
('{"name":"Restaurant exterior","image":"/images/kitchen.jpg","thumbnail":"/images/kitchen.jpg"}'),
('{"name":"Naan wrap","image":"/images/dish-2.jpg","thumbnail":"/images/dish-2.jpg"}'),
('{"name":"Curry from our kitchen","image":"/images/dish-3.jpg","thumbnail":"/images/dish-3.jpg"}');

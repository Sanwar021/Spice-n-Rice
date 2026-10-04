UPDATE settings SET data=jsonb_set(data,'{hero_text}','"Made to order. Served with soul."'::jsonb) WHERE data->>'hero_text'='Big flavor. Warm hearts.';
UPDATE settings SET data=jsonb_set(data,'{hero_image}','"/images/design/food-0.webp"'::jsonb) WHERE data->>'hero_image' IN ('/images/food.jpg','/images/food.webp');
INSERT INTO media(data) VALUES
('{"name":"Design reference · illustrative biryani","image":"/images/design/food-0.webp","thumbnail":"/images/design/food-0.webp"}'),
('{"name":"Design reference · illustrative curry","image":"/images/design/food-1.webp","thumbnail":"/images/design/food-1.webp"}'),
('{"name":"Design reference · illustrative paneer","image":"/images/design/food-2.webp","thumbnail":"/images/design/food-2.webp"}'),
('{"name":"Design reference · illustrative grill","image":"/images/design/food-3.webp","thumbnail":"/images/design/food-3.webp"}');

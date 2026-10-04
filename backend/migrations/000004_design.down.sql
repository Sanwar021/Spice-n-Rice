UPDATE settings SET data=jsonb_set(data,'{hero_text}','"Big flavor. Warm hearts."'::jsonb) WHERE data->>'hero_text'='Made to order. Served with soul.';
UPDATE settings SET data=jsonb_set(data,'{hero_image}','"/images/food.webp"'::jsonb) WHERE data->>'hero_image'='/images/design/food-0.webp';
DELETE FROM media WHERE data->>'image' LIKE '/images/design/%';

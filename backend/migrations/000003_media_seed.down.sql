DELETE FROM media WHERE data->>'image' LIKE '/images/%';
UPDATE settings SET data=jsonb_set(data,'{hero_image}','"/images/food.jpg"'::jsonb) WHERE data->>'hero_image'='/images/food.webp';

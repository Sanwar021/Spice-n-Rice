BEGIN;
CREATE TABLE IF NOT EXISTS campaigns (
  id bigserial PRIMARY KEY,
  data jsonb NOT NULL CHECK(jsonb_typeof(data)='object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname='touch' AND tgrelid='campaigns'::regclass
  ) THEN
    CREATE TRIGGER touch BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  END IF;
END $$;
UPDATE settings
SET data = data
  || jsonb_build_object(
    'hero_eyebrow', COALESCE(data->>'hero_eyebrow','BIG FLAVORS. NO FUSS.'),
    'hero_subtext', COALESCE(data->>'hero_subtext','Your neighborhood Indian canteen. Slow-crafted flavors, generous portions, and the best naans in town.'),
    'hero_primary_label', COALESCE(data->>'hero_primary_label','Order Online'),
    'hero_secondary_label', COALESCE(data->>'hero_secondary_label','Explore the Menu'),
    'hero_meta', COALESCE(data->>'hero_meta','Richardson, TX · Since 2009'),
    'hero_script', COALESCE(data->>'hero_script','a bowl full of happiness'),
    'hero_seal_top', COALESCE(data->>'hero_seal_top','MADE TO ORDER'),
    'hero_seal_bottom', COALESCE(data->>'hero_seal_bottom','SINCE 2009'),
    'hero_note_title', COALESCE(data->>'hero_note_title','Fresh. Every single time.'),
    'hero_note_text', COALESCE(data->>'hero_note_text','No shortcuts. Just good food.'),
    'about_image', COALESCE(data->>'about_image','/images/restaurant-interior.webp'),
    'lunch_image', COALESCE(data->>'lunch_image','/images/design/food-2.webp'),
    'tray_full_image', COALESCE(data->>'tray_full_image','/images/design/food-0.webp'),
    'tray_half_image', COALESCE(data->>'tray_half_image','/images/design/food-0.webp'),
    'gallery_images', COALESCE(data->'gallery_images','["/images/menu-printed/biryani.webp","/images/menu-printed/fish.webp","/images/menu-printed/samosa.webp","/images/menu-printed/chicken-wrap.webp"]'::jsonb)
  );
INSERT INTO campaigns(data)
SELECT jsonb_build_object(
  'name','Homepage lunch highlight',
  'title','A little of everything. A whole lot to love.',
  'description',COALESCE((SELECT data->>'lunch_text' FROM settings WHERE deleted_at IS NULL ORDER BY id LIMIT 1),'Two veg curries, one non-veg curry, and your choice of rice or naan.'),
  'image',COALESCE((SELECT data->>'lunch_image' FROM settings WHERE deleted_at IS NULL ORDER BY id LIMIT 1),'/images/design/food-2.webp'),
  'link_label','Call for Today''s Selection',
  'link_url','tel:',
  'visible',true,
  'sort_order',0
)
WHERE NOT EXISTS (SELECT 1 FROM campaigns WHERE deleted_at IS NULL);
COMMIT;

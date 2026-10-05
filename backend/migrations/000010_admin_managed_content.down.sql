BEGIN;
DROP TABLE IF EXISTS campaigns;
UPDATE settings
SET data = data
  - 'hero_eyebrow'
  - 'hero_subtext'
  - 'hero_primary_label'
  - 'hero_secondary_label'
  - 'hero_meta'
  - 'hero_script'
  - 'hero_seal_top'
  - 'hero_seal_bottom'
  - 'hero_note_title'
  - 'hero_note_text'
  - 'about_image'
  - 'lunch_image'
  - 'tray_full_image'
  - 'tray_half_image'
  - 'gallery_images';
COMMIT;

BEGIN;
UPDATE menu_items item SET price_cents=b.price_cents,data=b.data
FROM printed_menu_20261005_backup b WHERE item.id=b.id;
DELETE FROM menu_items WHERE id IN (SELECT id FROM printed_menu_20261005_added);
DELETE FROM media WHERE id IN (SELECT id FROM printed_menu_20261005_media);
DROP TABLE printed_menu_20261005_media;
DROP TABLE printed_menu_20261005_added;
DROP TABLE printed_menu_20261005_backup;
COMMIT;

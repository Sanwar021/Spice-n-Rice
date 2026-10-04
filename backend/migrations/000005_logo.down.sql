UPDATE settings SET data=jsonb_set(data,'{logo}','"/images/logo.svg"'::jsonb)
WHERE data->>'logo'='/images/spice-logo.webp';
DELETE FROM media WHERE data->>'image'='/images/spice-logo.webp';

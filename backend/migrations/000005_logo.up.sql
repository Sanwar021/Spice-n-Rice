UPDATE settings SET data=jsonb_set(data,'{logo}','"/images/spice-logo.webp"'::jsonb)
WHERE data->>'logo' IN ('/images/logo.svg','/images/original-logo.png') OR COALESCE(data->>'logo','')='';
INSERT INTO media(data) VALUES
('{"name":"Spice N Rice · transparent glossy logo","image":"/images/spice-logo.webp","thumbnail":"/images/spice-logo.webp"}');

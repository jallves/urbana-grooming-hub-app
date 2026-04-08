INSERT INTO settings (key, value)
VALUES ('checkin_homologation_mode', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
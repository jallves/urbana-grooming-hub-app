SELECT cron.schedule(
  'weekly-birthday-notify',
  '0 7 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://apizqnknnmjqpqovlkux.supabase.co/functions/v1/weekly-birthday-notify',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaXpxbmtubm1qcXBxb3Zsa3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDk1OTAsImV4cCI6MjA4Mzg4NTU5MH0.6vCTm7Jb8c-FHxZRq06HseZBwecKLhBvRZ7bGFYK7a4"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);
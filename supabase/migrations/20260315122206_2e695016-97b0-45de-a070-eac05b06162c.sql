-- Schedule the subscription renewal check to run daily at 8 AM
SELECT cron.schedule(
  'check-subscription-renewals-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url:='https://apizqnknnmjqpqovlkux.supabase.co/functions/v1/check-subscription-renewals',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaXpxbmtubm1qcXBxb3Zsa3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDk1OTAsImV4cCI6MjA4Mzg4NTU5MH0.6vCTm7Jb8c-FHxZRq06HseZBwecKLhBvRZ7bGFYK7a4"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);
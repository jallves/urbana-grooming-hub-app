-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar auto-mark-absent a cada 15 minutos
SELECT cron.schedule(
  'auto-mark-absent-every-15min',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://apizqnknnmjqpqovlkux.supabase.co/functions/v1/auto-mark-absent',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaXpxbmtubm1qcXBxb3Zsa3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDk1OTAsImV4cCI6MjA4Mzg4NTU5MH0.6vCTm7Jb8c-FHxZRq06HseZBwecKLhBvRZ7bGFYK7a4"}'::jsonb,
        body:='{"source": "cron"}'::jsonb
    ) as request_id;
  $$
);
-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remover cron job existente (se houver) para evitar duplicatas
SELECT cron.unschedule('send-appointment-reminders') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-appointment-reminders'
);

-- Criar cron job para enviar lembretes a cada 5 minutos
SELECT cron.schedule(
  'send-appointment-reminders',
  '*/5 * * * *', -- a cada 5 minutos
  $$
  SELECT net.http_post(
    url := 'https://bqftkknbvmggcbsubicl.supabase.co/functions/v1/send-appointment-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZnRra25idm1nZ2Nic3ViaWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNDQ4MjQsImV4cCI6MjA2MDkyMDgyNH0.50TxAQPb5vrvB1GQalFuLgW7WbH0xN9w6W3vU5w8PLM'
    ),
    body := jsonb_build_object('triggered_at', now()::text)
  ) AS request_id;
  $$
);
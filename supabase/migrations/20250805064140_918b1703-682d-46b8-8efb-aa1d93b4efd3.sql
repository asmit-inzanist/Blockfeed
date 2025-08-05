-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily briefing to run every day at 9:00 AM UTC
-- This will automatically send daily briefings to all active subscribers
SELECT cron.schedule(
  'daily-news-briefing',
  '0 9 * * *', -- 9:00 AM every day
  $$
  SELECT
    net.http_post(
        url:='https://hdglhbwwvwkojjdrrsga.supabase.co/functions/v1/schedule-daily-briefings',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ2xoYnd3dndrb2pqZHJyc2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgxMjc2MCwiZXhwIjoyMDY5Mzg4NzYwfQ.v3vXyqMiAIGv2FmDlpP_z9tRPnIV0G6_k5I9YhSJtMY"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);
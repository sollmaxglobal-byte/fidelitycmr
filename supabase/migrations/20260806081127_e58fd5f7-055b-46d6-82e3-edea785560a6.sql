DO $$ BEGIN
  PERFORM cron.unschedule('process-receipt-emails');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'process-receipt-emails',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://fidelity-invest.lovable.app/api/public/process-receipt-emails',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1dG1jZmN4amp1cnRxZmdxZWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzE5MTIsImV4cCI6MjA5NDAwNzkxMn0.jUodhp33stZHw7-YSA6ymUr8rFR2aepyVH_layG4GgM"}'::jsonb,
    body := '{}'::jsonb
  );
  $cron$
);
create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'demo-reset-midnight',
  '0 0 * * *',
  $$select reset_demo_school();$$
);

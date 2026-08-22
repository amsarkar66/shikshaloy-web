-- pg_cron runs in UTC; IST is UTC+5:30, so IST midnight = 18:30 UTC the previous day.
select cron.unschedule('demo-reset-midnight');
select cron.schedule(
  'demo-reset-midnight-ist',
  '30 18 * * *',
  $$select reset_demo_school();$$
);

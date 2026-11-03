-- Lumoflix push notifications (run after schema.sql): the devices that receive them, and what the notifier
-- (supabase/functions/notify) has already told each profile. The notifier runs hourly (pg_cron, see the end).

-- One row per device that turned notifications on, for the profile it's using
create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  profile_id text not null,
  p256dh text not null,
  auth text not null,
  time_zone text not null default 'UTC', -- for quiet hours
  created_at timestamptz not null default now(),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

alter table public.push_subscriptions enable row level security;
create policy "Own devices" on public.push_subscriptions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- The notifier's memory per profile: latest episode seen per show, reminders already sent, last send time.
-- No policies: only the notifier (service role) reads and writes it.
create table public.notify_state (
  user_id uuid not null,
  profile_id text not null,
  key text not null,
  value text not null,
  primary key (user_id, profile_id, key),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

alter table public.notify_state enable row level security;

-- Hourly run. Set up by hand with the notifier's CRON_SECRET (kept out of the repo):
--   create extension if not exists pg_cron;
--   create extension if not exists pg_net;
--   select cron.schedule('lumoflix-notify', '5 * * * *', $$
--     select net.http_post(
--       url := 'https://<project-ref>.supabase.co/functions/v1/notify',
--       headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
--       body := '{}'::jsonb,
--       timeout_milliseconds := 120000)
--   $$);

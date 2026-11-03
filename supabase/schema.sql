-- Lumoflix accounts & sync: what a signed-in viewer's profiles and lists look like on the server.
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.
--
-- The app stays local-first (localStorage); this is the copy that follows the account between devices
-- (see src/utils/sync.ts). Row-level security: every account can only ever see and change its own rows.

-- Profiles ("Me", "Kids", …). `id` is the app's own profile id ("main" for the first one).
create table public.profiles (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  name text not null check (char_length(name) between 1 and 20),
  color text not null,
  kids boolean not null default false,
  pin text, -- hash of the profile lock's PIN
  primary key (user_id, id)
);

-- My List
create table public.my_list (
  user_id uuid not null default auth.uid(),
  profile_id text not null,
  type text not null check (type in ('movie', 'tv')),
  tmdb_id integer not null,
  title text not null,
  poster_path text,
  backdrop_path text,
  vote_average real,
  release_date text,
  first_air_date text,
  added_at bigint not null, -- ms timestamp
  primary key (user_id, profile_id, type, tmdb_id),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

-- Continue Watching: the latest progress per title
create table public.watch_history (
  user_id uuid not null default auth.uid(),
  profile_id text not null,
  type text not null check (type in ('movie', 'tv')),
  tmdb_id integer not null,
  title text not null,
  poster text,
  backdrop text,
  season integer,
  episode integer,
  time double precision not null, -- seconds watched
  duration double precision not null, -- seconds
  updated_at bigint not null, -- ms timestamp
  primary key (user_id, profile_id, type, tmdb_id),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

-- Episodes watched to the end
create table public.watched_episodes (
  user_id uuid not null default auth.uid(),
  profile_id text not null,
  show_id integer not null,
  season integer not null,
  episode integer not null,
  primary key (user_id, profile_id, show_id, season, episode),
  foreign key (user_id, profile_id) references public.profiles (user_id, id) on delete cascade
);

-- Only the signed-in account's own rows, for every table
alter table public.profiles enable row level security;
alter table public.my_list enable row level security;
alter table public.watch_history enable row level security;
alter table public.watched_episodes enable row level security;

create policy "Own profiles" on public.profiles for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own list" on public.my_list for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own history" on public.watch_history for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own watched episodes" on public.watched_episodes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Lets a viewer delete their own account (and, through the cascades, everything above) from the app
create function public.delete_account() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = auth.uid();
$$;
revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

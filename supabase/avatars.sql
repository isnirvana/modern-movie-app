-- Profile avatars (run after schema.sql): the TMDB photo a profile picked (an actor's or director's), as TMDB's
-- image path, e.g. '/abc123.jpg'. Empty means the colour-and-initial avatar. Only paths are accepted, so the
-- app always loads it from TMDB's image server.
alter table public.profiles
  add column avatar text check (avatar ~ '^/[A-Za-z0-9_.-]{1,100}$');

-- Let the API see the new column straight away
notify pgrst, 'reload schema';

-- "Popular on Lumoflix" (run after schema.sql): the titles most viewers watched lately.
-- Aggregate only: counts of distinct accounts, and a title is listed only once at least 3 accounts watched it,
-- so nobody's viewing can be singled out. Callable by anyone (signed in or not); it can't read rows directly.
create function public.popular_titles(days integer default 7, max_titles integer default 20)
returns table (type text, tmdb_id integer, title text, poster text, backdrop text, viewers bigint)
language sql stable security definer set search_path = '' as $$
  select h.type, h.tmdb_id, max(h.title), max(h.poster), max(h.backdrop), count(distinct h.user_id)
  from public.watch_history h
  where h.updated_at > (extract(epoch from now()) * 1000)::bigint - least(greatest(days, 1), 30) * 86400000::bigint
  group by h.type, h.tmdb_id
  having count(distinct h.user_id) >= 3
  order by count(distinct h.user_id) desc, max(h.updated_at) desc
  limit least(greatest(max_titles, 1), 50)
$$;

revoke all on function public.popular_titles(integer, integer) from public;
grant execute on function public.popular_titles(integer, integer) to anon, authenticated;

// src/components/PopularOnLumoflix.tsx
// "Popular on Lumoflix": what viewers here watched this week (supabase/popular.sql — counts only, and only titles
// at least 3 accounts watched). Hidden in Kids profiles (it's everyone's viewing) and until there's something to show.
import { useQuery } from "@tanstack/react-query"
import MediaRow from "./MediaRow"
import { isKidsMode } from "../utils/profiles"

async function fetchPopular() {
  const { supabase } = await import("../utils/supabase")
  if (!supabase) return []
  const { data, error } = await supabase.rpc("popular_titles", { days: 7, max_titles: 20 })
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.tmdb_id,
    media_type: r.type,
    title: r.title,
    poster_path: r.poster,
    backdrop_path: r.backdrop,
    released: true, // people watched it
  }))
}

export default function PopularOnLumoflix() {
  const kids = isKidsMode()
  const { data = [], isLoading } = useQuery({
    queryKey: ["popular-on-lumoflix"],
    queryFn: fetchPopular,
    enabled: !kids,
    staleTime: 1000 * 60 * 30,
  })
  if (kids) return null
  return <MediaRow title="Popular on Lumoflix" items={data} isLoading={isLoading} />
}

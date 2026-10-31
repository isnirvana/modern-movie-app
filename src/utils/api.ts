import axios from "axios"

const TMDB_BASE = "https://api.themoviedb.org/3"
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const api = axios.create({
  baseURL: TMDB_BASE,
  params: { api_key: API_KEY },
})

// Fetch trending movies
// Fetch trending movies and TV shows
export const fetchTrending = (page: number) =>
  api.get("/trending/all/day", { params: { page } }).then((res) => res.data)

// Search movies by query
export const searchMovies = (query: string, page: number) =>
  api.get("/search/movie", { params: { query, page } }).then((res) => res.data)

// Fetch genre list
export const fetchGenres = () =>
  api.get("/genre/movie/list").then((res) => res.data.genres)

// Fetch movies by genre with sort
export const fetchByGenre = (genreId: number, sortBy: string, page: number) =>
  api
    .get("/discover/movie", {
      params: { with_genres: genreId, sort_by: sortBy, page },
    })
    .then((res) => res.data)

// Fetch movie details + credits
export const fetchMovieDetails = (id: number) =>
  api
    .get(`/movie/${id}`, { params: { append_to_response: "credits,videos,recommendations,similar" } })
    .then((res) => res.data)

export const fetchTVDetails = (id: number) =>
  api
    .get(`/tv/${id}`, { params: { append_to_response: "credits,external_ids,videos,recommendations,similar" } })
    .then((res) => res.data)

// Fetch one page of any TMDB list endpoint, tagging each item with its media type
export const fetchList = (path: string, mediaType?: "movie" | "tv") =>
  api
    .get(path)
    .then((res) =>
      res.data.results.map((item: any) => ({ ...item, media_type: item.media_type ?? mediaType }))
    )

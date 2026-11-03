// export default function App() {
//   return (
//     <ErrorBoundary>
//       <Layout>
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/search/:query" element={<SearchPage />} />
//           <Route path="/genre/:id" element={<GenrePage />} />
//           <Route path="/movie/:id" element={<MovieDetail />} />
//         </Routes>
//       </Layout>
//     </ErrorBoundary>
//   );
// }

import { lazy, useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import Home from "./pages/Home"
import ErrorBoundary from "./components/ErrorBoundary"
import { isKidsMode } from "./utils/profiles"

// Other pages load separately, keeping the first download small (Home is where most visits start).
// Their code is then fetched in the background (below), so opening one later is instant.
const pages = {
  MoviesPage: () => import("./pages/MoviesPage"),
  TVPage: () => import("./pages/TVPage"),
  GenrePage: () => import("./pages/GenrePage"),
  MovieDetail: () => import("./pages/MovieDetail"),
  TVDetails: () => import("./pages/TVDetails"),
  SearchResultsPage: () => import("./pages/SearchResultsPage"),
  NotFound: () => import("./pages/NotFound"),
  MyListPage: () => import("./pages/MyListPage"),
  ProfilesPage: () => import("./pages/ProfilesPage"),
  ForYouPage: () => import("./pages/ForYouPage"),
  AccountPage: () => import("./pages/AccountPage"),
  KidsHome: () => import("./pages/KidsHome"),
  PersonPage: () => import("./pages/PersonPage"),
}
const MoviesPage = lazy(pages.MoviesPage)
const TVPage = lazy(pages.TVPage)
const GenrePage = lazy(pages.GenrePage)
const MovieDetail = lazy(pages.MovieDetail)
const TVDetails = lazy(pages.TVDetails)
const SearchResultsPage = lazy(pages.SearchResultsPage)
const NotFound = lazy(pages.NotFound)
const MyListPage = lazy(pages.MyListPage)
const ProfilesPage = lazy(pages.ProfilesPage)
const ForYouPage = lazy(pages.ForYouPage)
const AccountPage = lazy(pages.AccountPage)
const KidsHome = lazy(pages.KidsHome)
const PersonPage = lazy(pages.PersonPage)

// Once the first page is up and the browser is idle: fetch the other pages' code (not on Data Saver)
function usePrefetchPages() {
  useEffect(() => {
    if ((navigator as any).connection?.saveData) return
    const prefetch = () => Object.values(pages).forEach((load) => load().catch(() => {}))
    const idle = (window as any).requestIdleCallback as ((cb: () => void) => number) | undefined
    const id = idle ? idle(prefetch) : window.setTimeout(prefetch, 2000)
    return () => (idle ? (window as any).cancelIdleCallback(id) : clearTimeout(id))
  }, [])
}

export default function App() {
  usePrefetchPages()
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          {/* Kids profiles get their own Home (switching profile restarts the app, so this is read once) */}
          <Route path="/" element={isKidsMode() ? <KidsHome /> : <Home />} />
          <Route path="/for-you" element={<ForYouPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/tv" element={<TVPage />} />
          <Route path="/genre/:id" element={<GenrePage />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/tv/:id" element={<TVDetails />} />
          <Route path="/person/:id" element={<PersonPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/my-list" element={<MyListPage />} />
          <Route path="/profiles" element={<ProfilesPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  )
}

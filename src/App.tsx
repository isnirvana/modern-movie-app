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

import { lazy, Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import Home from "./pages/Home"
import ErrorBoundary from "./components/ErrorBoundary"
import LoadingSkeleton from "./components/LoadingSkeleton"
import { isKidsMode } from "./utils/profiles"

// Other pages load on first visit, keeping the first download small (Home is where most visits start)
const MoviesPage = lazy(() => import("./pages/MoviesPage"))
const TVPage = lazy(() => import("./pages/TVPage"))
const GenrePage = lazy(() => import("./pages/GenrePage"))
const MovieDetail = lazy(() => import("./pages/MovieDetail"))
const TVDetails = lazy(() => import("./pages/TVDetails"))
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage"))
const NotFound = lazy(() => import("./pages/NotFound"))
const MyListPage = lazy(() => import("./pages/MyListPage"))
const ProfilesPage = lazy(() => import("./pages/ProfilesPage"))
const KidsHome = lazy(() => import("./pages/KidsHome"))

export default function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Suspense fallback={<LoadingSkeleton />}>
          <Routes>
            {/* Kids profiles get their own Home (switching profile restarts the app, so this is read once) */}
            <Route path="/" element={isKidsMode() ? <KidsHome /> : <Home />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/tv" element={<TVPage />} />
            <Route path="/genre/:id" element={<GenrePage />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/tv/:id" element={<TVDetails />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/my-list" element={<MyListPage />} />
            <Route path="/profiles" element={<ProfilesPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </ErrorBoundary>
  )
}

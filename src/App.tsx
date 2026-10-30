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

import { Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import Home from "./pages/Home"
import MoviesPage from "./pages/MoviesPage"
import TVPage from "./pages/TVPage"
import GenrePage from "./pages/GenrePage"
import MovieDetail from "./pages/MovieDetail"
import TVDetails from "./pages/TVDetails"
import SearchResultsPage from "./pages/SearchResultsPage"
import NotFound from "./pages/NotFound"
import ErrorBoundary from "./components/ErrorBoundary"

export default function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/tv" element={<TVPage />} />
          <Route path="/genre/:id" element={<GenrePage />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/tv/:id" element={<TVDetails />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  )
}

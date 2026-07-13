import React, { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Search, Filter } from "lucide-react";

import {
  SITE_NAME,
  LANGUAGES,
} from "@/lib/constants";

import MovieGrid from "@/components/MovieGrid";
import Breadcrumb from "@/components/Breadcrumb";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

const TMDB_API_URL = "/api/tmdb";

function createMovieSlug(movie) {
  const titleSlug = movie.title
    ?.toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${movie.id}-${titleSlug || "movie"}`;
}

async function fetchTMDB(endpoint) {
  const response = await fetch(
    `${TMDB_API_URL}${endpoint}`
  );

  if (!response.ok) {
    let message =
      `Movie API error: ${response.status}`;

    try {
      const data = await response.json();

      message =
        data.status_message ||
        data.error ||
        message;
    } catch {
      // Ignore invalid JSON
    }

    throw new Error(message);
  }

  return response.json();
}

function normalizeMovie(movie) {
  return {
    ...movie,
    tmdb_id: movie.id,
    movie_id: movie.id,
    slug: createMovieSlug(movie),

    release_year: movie.release_date
      ? movie.release_date.substring(0, 4)
      : null,

    rating: movie.vote_average,
    popularity: movie.popularity,
  };
}

export default function SearchPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const urlParams = new URLSearchParams(location.search);
  const urlQuery = urlParams.get("q") || "";

  const [query, setQuery] = useState(urlQuery);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [yearFilter, setYearFilter] = useState("");
  const [langFilter, setLangFilter] = useState("");

  /*
   * Keep the input synchronized with the URL.
   * Also performs the search when:
   *
   * /search?q=avatar
   */
  useEffect(() => {
    setQuery(urlQuery);

    if (urlQuery.trim()) {
      searchMovies(urlQuery.trim());
    } else {
      setMovies([]);
      setLoading(false);
    }

    document.title = urlQuery
      ? `Search: ${urlQuery} | ${SITE_NAME}`
      : `Search Movies | ${SITE_NAME}`;

    updateMetaDescription(urlQuery);

    window.scrollTo(0, 0);
  }, [location.search]);

  function updateMetaDescription(searchQuery) {
    const description = searchQuery
      ? `Search results for "${searchQuery}" on ${SITE_NAME}. Discover movie details, ratings, release dates, trailers and cast information.`
      : `Search movies on ${SITE_NAME}. Discover movie details, ratings, release dates, trailers and cast information.`;

    let metaDescription = document.querySelector(
      'meta[name="description"]'
    );

    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }

    metaDescription.setAttribute(
      "content",
      description.substring(0, 160)
    );
  }

  async function searchMovies(searchQuery) {
    setLoading(true);
    setError("");
    setMovies([]);

    try {
      /*
       * Fetch the first 3 pages.
       * This gives up to approximately 60 search results.
       */
      const firstPage = await fetchTMDB(
        `/search/movie?query=${encodeURIComponent(searchQuery)}` +
          `&language=en-US` +
          `&include_adult=false` +
          `&page=1`
      );

      /*
       * Do not request pages that do not exist.
       */
      const totalPages = Math.min(
        firstPage.total_pages || 1,
        3
      );

      const remainingRequests = [];

      for (let page = 2; page <= totalPages; page++) {
        remainingRequests.push(
          fetchTMDB(
            `/search/movie?query=${encodeURIComponent(searchQuery)}` +
              `&language=en-US` +
              `&include_adult=false` +
              `&page=${page}`
          )
        );
      }

      const remainingResponses =
        await Promise.all(remainingRequests);

      const allMovies = [
        ...(firstPage.results || []),
        ...remainingResponses.flatMap(
          (response) => response.results || []
        ),
      ];

      /*
       * Remove duplicate movies.
       */
      const uniqueMovies = Array.from(
        new Map(
          allMovies.map((movie) => [movie.id, movie])
        ).values()
      );

      /*
       * Normalize for MovieGrid / MovieCard.
       */
      const normalizedMovies = uniqueMovies
        .filter((movie) => movie.poster_path)
        .map(normalizeMovie);

      setMovies(normalizedMovies);
    } catch (err) {
      console.error("Movie search failed:", err);

      setError(
        err.message ||
          "Unable to search movies. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Compute available years from current search results.
   */
  const availableYears = useMemo(() => {
    return [
      ...new Set(
        movies
          .map((movie) =>
            movie.release_date
              ? movie.release_date.substring(0, 4)
              : null
          )
          .filter(Boolean)
      ),
    ].sort((a, b) => Number(b) - Number(a));
  }, [movies]);

  /*
   * Compute available languages from current results.
   */
  const availableLangs = useMemo(() => {
    const codes = [
      ...new Set(
        movies
          .map((movie) => movie.original_language)
          .filter(Boolean)
      ),
    ];

    return LANGUAGES.filter((language) =>
      codes.includes(language.code)
    );
  }, [movies]);

  /*
   * Apply year and language filters locally
   * to the TMDB search results.
   */
  const filteredResults = useMemo(() => {
    return movies.filter((movie) => {
      if (
        yearFilter &&
        !movie.release_date?.startsWith(yearFilter)
      ) {
        return false;
      }

      if (
        langFilter &&
        movie.original_language !== langFilter
      ) {
        return false;
      }

      return true;
    });
  }, [movies, yearFilter, langFilter]);

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    /*
     * Reset filters when performing a new search.
     */
    setYearFilter("");
    setLangFilter("");

    navigate(
      `/search?q=${encodeURIComponent(trimmedQuery)}`
    );
  }

  function handleClearAll() {
    setQuery("");
    setMovies([]);
    setYearFilter("");
    setLangFilter("");
    setError("");

    navigate("/search");
  }

  const hasSearchQuery = Boolean(urlQuery.trim());
  const hasFilters = Boolean(yearFilter || langFilter);

  return (
    <div className="min-h-screen bg-[#050505] pt-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">

        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            {
              label: "Home",
              href: "/",
            },
            {
              label: "Search",
            },
          ]}
        />

        {/* Header */}
        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Search Movies
        </h1>

        <p className="mt-2 text-sm text-[#888]">
          Search millions of movies and discover ratings,
          trailers, cast information and more.
        </p>

        {/* Search */}
        <form
          onSubmit={handleSubmit}
          className="mt-6"
        >
          <div className="flex max-w-2xl gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#555]" />

              <input
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search by movie title..."
                autoComplete="off"
                className="w-full rounded-lg border border-[#1a1a1a] bg-[#0F0F0F] py-3 pl-12 pr-4 text-white placeholder-[#555] focus:border-[#5D5DFF] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!query.trim()}
              className="rounded-lg bg-[#5D5DFF] px-5 py-3 font-semibold text-white transition hover:bg-[#4b4be8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Search
            </button>
          </div>
        </form>

        {/* Filters */}
        {movies.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-[#888]">
              <Filter className="h-4 w-4" />
              Filters:
            </div>

            {/* Year */}
            <select
              value={yearFilter}
              onChange={(event) =>
                setYearFilter(event.target.value)
              }
              className="rounded-lg border border-[#1a1a1a] bg-[#0F0F0F] px-3 py-2 text-sm text-white focus:border-[#5D5DFF] focus:outline-none"
            >
              <option value="">All Years</option>

              {availableYears.map((year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              ))}
            </select>

            {/* Language */}
            <select
              value={langFilter}
              onChange={(event) =>
                setLangFilter(event.target.value)
              }
              className="rounded-lg border border-[#1a1a1a] bg-[#0F0F0F] px-3 py-2 text-sm text-white focus:border-[#5D5DFF] focus:outline-none"
            >
              <option value="">
                All Languages
              </option>

              {availableLangs.map((language) => (
                <option
                  key={language.code}
                  value={language.code}
                >
                  {language.name}
                </option>
              ))}
            </select>

            {(hasSearchQuery || hasFilters) && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-sm text-[#5D5DFF] hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Results */}
        <div className="mt-8">
          {loading ? (
            <div className="py-20">
              <LoadingSpinner
                text={`Searching for "${urlQuery}"...`}
              />
            </div>
          ) : error ? (
            <div className="py-20">
              <EmptyState
                title="Search failed"
                message={error}
              />

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    searchMovies(urlQuery)
                  }
                  className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : hasSearchQuery &&
            filteredResults.length === 0 ? (
            <EmptyState
              title="No results found"
              message={
                hasFilters
                  ? "No movies match the selected filters."
                  : `No movies found for "${urlQuery}". Try a different movie title.`
              }
            />
          ) : filteredResults.length > 0 ? (
            <>
              <p className="mb-4 text-sm text-[#888]">
                <span className="font-semibold text-white">
                  {filteredResults.length}
                </span>{" "}
                {filteredResults.length === 1
                  ? "result"
                  : "results"}{" "}
                found for{" "}
                <span className="text-white">
                  "{urlQuery}"
                </span>
              </p>

              <MovieGrid
                movies={filteredResults}
              />
            </>
          ) : (
            <div className="py-12">
              <p className="text-sm text-[#888]">
                Enter a movie title above to start searching.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
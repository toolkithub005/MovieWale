import React, { useEffect, useState } from "react";

import MovieGrid from "@/components/MovieGrid";
import Breadcrumb from "@/components/Breadcrumb";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { SITE_NAME, CATEGORIES } from "@/lib/constants";

const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

function createMovieSlug(movie) {
  const titleSlug = movie.title
    ?.toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${movie.id}-${titleSlug || "movie"}`;
}

async function fetchTMDB(endpoint) {
  if (!TMDB_API_KEY) {
    throw new Error("VITE_TMDB_API_KEY is missing.");
  }

  const separator = endpoint.includes("?") ? "&" : "?";

  const response = await fetch(
    `${TMDB_API_URL}${endpoint}${separator}api_key=${TMDB_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  return response.json();
}

function normalizeMovie(movie, category) {
  return {
    ...movie,
    tmdb_id: movie.id,
    movie_id: movie.id,
    category,
    slug: createMovieSlug(movie),
    release_year: movie.release_date
      ? movie.release_date.substring(0, 4)
      : null,
    rating: movie.vote_average,
    popularity: movie.popularity,
  };
}

export default function MoviesPage() {
  const [category, setCategory] = useState("popular");
  const [movies, setMovies] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `All Movies | ${SITE_NAME}`;
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    loadCategory(category);
  }, [category]);

  async function loadCategory(categoryKey) {
    setLoading(true);
    setError("");
    setMovies([]);
    setCurrentPage(1);

    try {
      /*
       * TMDB does not have an "all" endpoint.
       * For All, use discover/movie.
       */
      const endpoint =
        categoryKey === "all"
          ? "/discover/movie?sort_by=popularity.desc&include_adult=false&page=1"
          : `/movie/${categoryKey}?language=en-US&page=1`;

      const data = await fetchTMDB(endpoint);

      const normalizedMovies = (data.results || [])
        .filter((movie) => movie.poster_path)
        .map((movie) =>
          normalizeMovie(movie, categoryKey)
        );

      setMovies(normalizedMovies);

      /*
       * TMDB generally limits accessible pagination
       * to a maximum of 500 pages.
       */
      setTotalPages(
        Math.min(data.total_pages || 1, 500)
      );

      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to load movies:", err);

      setError(
        err.message || "Unable to load movies."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    if (
      loadingMore ||
      currentPage >= totalPages
    ) {
      return;
    }

    const nextPage = currentPage + 1;

    setLoadingMore(true);

    try {
      const endpoint =
        category === "all"
          ? `/discover/movie?sort_by=popularity.desc&include_adult=false&page=${nextPage}`
          : `/movie/${category}?language=en-US&page=${nextPage}`;

      const data = await fetchTMDB(endpoint);

      const newMovies = (data.results || [])
        .filter((movie) => movie.poster_path)
        .map((movie) =>
          normalizeMovie(movie, category)
        );

      /*
       * Append new movies and remove duplicates.
       */
      setMovies((previousMovies) => {
        const combined = [
          ...previousMovies,
          ...newMovies,
        ];

        return Array.from(
          new Map(
            combined.map((movie) => [
              movie.id,
              movie,
            ])
          ).values()
        );
      });

      setCurrentPage(nextPage);
    } catch (err) {
      console.error(
        "Failed to load more movies:",
        err
      );

      setError(
        "Unable to load more movies. Please try again."
      );
    } finally {
      setLoadingMore(false);
    }
  }

  function handleCategoryChange(categoryKey) {
    if (categoryKey === category) {
      return;
    }

    setCategory(categoryKey);

    const selectedCategory = CATEGORIES.find(
      (item) => item.key === categoryKey
    );

    document.title =
      categoryKey === "all"
        ? `All Movies | ${SITE_NAME}`
        : `${selectedCategory?.label || "Movies"} | ${SITE_NAME}`;
  }

  const categoryName =
    category === "all"
      ? "All Movies"
      : CATEGORIES.find(
          (item) => item.key === category
        )?.label || "Movies";

  return (
    <div className="min-h-screen bg-[#050505] pt-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">

        <Breadcrumb
          items={[
            {
              label: "Home",
              href: "/",
            },
            {
              label: "Movies",
            },
          ]}
        />

        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          {categoryName}
        </h1>

        <p className="mt-2 text-sm text-[#888]">
          Browse popular, now playing, top rated and
          upcoming movies
        </p>

        {/* Categories */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              handleCategoryChange("all")
            }
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              category === "all"
                ? "bg-white text-[#050505]"
                : "border border-[#1a1a1a] bg-[#0F0F0F] text-[#D4D4D4] hover:text-white"
            }`}
          >
            All
          </button>

          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat.key}
              onClick={() =>
                handleCategoryChange(cat.key)
              }
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                category === cat.key
                  ? "bg-white text-[#050505]"
                  : "border border-[#1a1a1a] bg-[#0F0F0F] text-[#D4D4D4] hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="py-20">
              <LoadingSpinner
                text={`Loading ${categoryName.toLowerCase()}...`}
              />
            </div>
          ) : error && movies.length === 0 ? (
            <div className="py-20">
              <EmptyState
                title="Unable to load movies"
                message={error}
              />

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    loadCategory(category)
                  }
                  className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : movies.length === 0 ? (
            <EmptyState
              title="No movies found"
              message="No movies are currently available."
            />
          ) : (
            <>
              <p className="mb-4 text-sm text-[#888]">
                Showing{" "}
                <span className="font-semibold text-white">
                  {movies.length}
                </span>{" "}
                movies
              </p>

              <MovieGrid movies={movies} />

              {error && (
                <p className="mt-6 text-center text-sm text-red-500">
                  {error}
                </p>
              )}

              {currentPage < totalPages && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="min-w-[160px] rounded-lg border border-[#333] bg-[#0F0F0F] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingMore
                      ? "Loading..."
                      : "Load More Movies"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  SITE_NAME,
  getLanguageBySlug,
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

export default function LanguageDetailPage() {
  const { langSlug } = useParams();
  const lang = getLanguageBySlug(langSlug);

  const [movies, setMovies] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);

    if (!lang) {
      setLoading(false);
      return;
    }

    document.title =
      `${lang.name} Movies | ${SITE_NAME}`;

    updateMetaDescription();
    loadInitialMovies();
  }, [langSlug]);

  function updateMetaDescription() {
    if (!lang) return;

    const description =
      `Discover popular and latest ${lang.name} movies. ` +
      `Browse ratings, release dates, trailers and movie information on ${SITE_NAME}.`;

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

  function buildEndpoint(page) {
    return (
      `/discover/movie?language=en-US` +
      `&with_original_language=${encodeURIComponent(lang.code)}` +
      `&sort_by=popularity.desc` +
      `&include_adult=false` +
      `&include_video=false` +
      `&page=${page}`
    );
  }

  async function loadInitialMovies() {
    if (!lang) return;

    setLoading(true);
    setError("");
    setMovies([]);
    setCurrentPage(1);

    try {
      const data = await fetchTMDB(
        buildEndpoint(1)
      );

      const normalizedMovies = (
        data.results || []
      )
        .filter((movie) => movie.poster_path)
        .map(normalizeMovie);

      setMovies(normalizedMovies);
      setCurrentPage(1);

      setTotalPages(
        Math.min(data.total_pages || 1, 500)
      );
    } catch (err) {
      console.error(
        `Failed to load ${lang.name} movies:`,
        err
      );

      setError(
        err.message ||
          `Unable to load ${lang.name} movies.`
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
    setError("");

    try {
      const data = await fetchTMDB(
        buildEndpoint(nextPage)
      );

      const newMovies = (
        data.results || []
      )
        .filter((movie) => movie.poster_path)
        .map(normalizeMovie);

      /*
       * Append movies and remove duplicates.
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
        `Failed to load more ${lang.name} movies:`,
        err
      );

      setError(
        "Unable to load more movies. Please try again."
      );
    } finally {
      setLoadingMore(false);
    }
  }

  /*
   * Invalid language slug.
   */
  if (!lang) {
    return (
      <div className="min-h-screen bg-[#050505] pt-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <EmptyState
            title="Language not found"
            message="The language you're looking for doesn't exist."
          />
        </div>
      </div>
    );
  }

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
              label: "Languages",
              href: "/languages",
            },
            {
              label: `${lang.name} Movies`,
            },
          ]}
        />

        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          {lang.name} Movies
        </h1>

        <p className="mt-3 text-sm text-[#888]">
          Discover popular {lang.name} movies,
          ratings, release dates, trailers and more.
        </p>

        <div className="mt-8">
          {loading ? (
            <div className="py-20">
              <LoadingSpinner
                text={`Loading ${lang.name} movies...`}
              />
            </div>
          ) : error && movies.length === 0 ? (
            <div className="py-20">
              <EmptyState
                title={`Unable to load ${lang.name} movies`}
                message={error}
              />

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={loadInitialMovies}
                  className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : movies.length === 0 ? (
            <EmptyState
              title="No movies found"
              message={`No ${lang.name} movies are currently available.`}
            />
          ) : (
            <>
              <p className="mb-5 text-sm text-[#888]">
                Showing{" "}
                <span className="font-semibold text-white">
                  {movies.length}
                </span>{" "}
                {lang.name} movies
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
                    className="min-w-[180px] rounded-lg border border-[#333] bg-[#0F0F0F] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingMore
                      ? "Loading..."
                      : `Load More ${lang.name} Movies`}
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
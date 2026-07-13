import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { GENRES, SITE_NAME } from "@/lib/constants";
import MovieGrid from "@/components/MovieGrid";
import GenreNav from "@/components/GenreNav";
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

export default function GenrePage() {
  const { genreSlug } = useParams();

  const [movies, setMovies] = useState([]);
  const [genreId, setGenreId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const genre = GENRES.find(
    (g) =>
      g.slug?.toLowerCase() ===
      genreSlug?.toLowerCase()
  );

  const genreName =
    genre?.name ||
    genreSlug
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      ) ||
    "Genre";

  useEffect(() => {
    document.title =
      `${genreName} Movies | ${SITE_NAME}`;

    window.scrollTo(0, 0);

    loadInitialMovies();
  }, [genreSlug]);

  async function loadInitialMovies() {
    setLoading(true);
    setError("");
    setMovies([]);
    setCurrentPage(1);
    setGenreId(null);

    try {
      /*
       * Find the TMDB genre ID.
       */
      const genreData = await fetchTMDB(
        "/genre/movie/list?language=en-US"
      );

      const tmdbGenre = genreData.genres?.find(
        (item) =>
          item.name.toLowerCase() ===
          genreName.toLowerCase()
      );

      if (!tmdbGenre) {
        throw new Error(
          `Genre "${genreName}" was not found.`
        );
      }

      setGenreId(tmdbGenre.id);

      /*
       * Load the first page.
       */
      const data = await fetchTMDB(
        `/discover/movie?language=en-US` +
          `&with_genres=${tmdbGenre.id}` +
          `&sort_by=popularity.desc` +
          `&include_adult=false` +
          `&include_video=false` +
          `&page=1`
      );

      const normalizedMovies = (
        data.results || []
      )
        .filter((movie) => movie.poster_path)
        .map(normalizeMovie);

      setMovies(normalizedMovies);
      setCurrentPage(1);

      /*
       * TMDB limits accessible pages.
       */
      setTotalPages(
        Math.min(data.total_pages || 1, 500)
      );
    } catch (err) {
      console.error(
        `Failed to load ${genreName} movies:`,
        err
      );

      setError(
        err.message ||
          `Unable to load ${genreName} movies.`
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    if (
      loadingMore ||
      !genreId ||
      currentPage >= totalPages
    ) {
      return;
    }

    const nextPage = currentPage + 1;

    setLoadingMore(true);
    setError("");

    try {
      const data = await fetchTMDB(
        `/discover/movie?language=en-US` +
          `&with_genres=${genreId}` +
          `&sort_by=popularity.desc` +
          `&include_adult=false` +
          `&include_video=false` +
          `&page=${nextPage}`
      );

      const newMovies = (
        data.results || []
      )
        .filter((movie) => movie.poster_path)
        .map(normalizeMovie);

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
              label: `${genreName} Movies`,
            },
          ]}
        />

        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          {genreName} Movies
        </h1>

        <p className="mt-3 text-sm text-[#888]">
          Browse popular {genreName.toLowerCase()} movies,
          ratings, release dates and more.
        </p>

        <GenreNav activeGenre={genreSlug} />

        {loading ? (
          <div className="py-20">
            <LoadingSpinner
              text={`Loading ${genreName} movies...`}
            />
          </div>
        ) : error && movies.length === 0 ? (
          <div className="py-20">
            <EmptyState
              title={`Unable to load ${genreName} movies`}
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
            title={`No ${genreName} movies found`}
            message="No movies are currently available for this genre."
          />
        ) : (
          <>
            <p className="mb-5 text-sm text-[#888]">
              Showing{" "}
              <span className="font-semibold text-white">
                {movies.length}
              </span>{" "}
              {genreName} movies
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
                    : "Load More Movies"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
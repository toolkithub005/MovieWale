import React, { useEffect, useState } from "react";

import HeroSection from "@/components/HeroSection";
import MovieGrid from "@/components/MovieGrid";
import GenreNav from "@/components/GenreNav";
import LoadingSpinner from "@/components/LoadingSpinner";
import LanguageNav from "@/components/LanguageNav";
import SeoContent from "@/components/SeoContent";

import {
  SITE_NAME,
  SITE_TAGLINE,
  LANGUAGES,
} from "@/lib/constants";

const TMDB_API_URL = "/api/tmdb";

/**
 * Call our own server-side TMDB proxy.
 *
 * Browser:
 * /api/tmdb/movie/popular
 *
 * Server:
 * https://api.themoviedb.org/3/movie/popular
 */
async function fetchTMDB(endpoint) {
  const response = await fetch(
    `${TMDB_API_URL}${endpoint}`
  );

  if (!response.ok) {
    let message = `Movie API error: ${response.status}`;

    try {
      const data = await response.json();

      message =
        data.status_message ||
        data.error ||
        message;
    } catch {
      // Response was not JSON
    }

    throw new Error(message);
  }

  return response.json();
}

/**
 * Fetch one movie category.
 */
async function fetchMovies(endpoint, category) {
  const data = await fetchTMDB(
    `${endpoint}?language=en-US&page=1`
  );

  return (data.results || [])
    .filter((movie) => movie.poster_path)
    .map((movie) => ({
      ...movie,

      // Keep compatibility with existing components
      tmdb_id: movie.id,
      movie_id: movie.id,
      category,

      rating: movie.vote_average,
      popularity: movie.popularity,

      release_year: movie.release_date
        ? movie.release_date.substring(0, 4)
        : null,
    }));
}

export default function Home() {
  const [movies, setMovies] = useState({
    now_playing: [],
    popular: [],
    top_rated: [],
    upcoming: [],
  });

  const [recentlyAdded, setRecentlyAdded] =
    useState([]);

  const [
    availableLanguages,
    setAvailableLanguages,
  ] = useState([]);

  const [loading, setLoading] = useState(true);
  const [heroMovie, setHeroMovie] =
    useState(null);

  const [error, setError] = useState("");

  useEffect(() => {
    document.title =
      `${SITE_NAME} — ${SITE_TAGLINE}`;

    loadMovies();
  }, []);

  async function loadMovies() {
    try {
      setLoading(true);
      setError("");

      /**
       * No TMDB API key is used here.
       *
       * The frontend calls:
       * /api/tmdb/...
       *
       * server.js adds the API key.
       */
      const [
        nowPlayingMovies,
        popularMovies,
        topRatedMovies,
        upcomingMovies,
      ] = await Promise.all([
        fetchMovies(
          "/movie/now_playing",
          "now_playing"
        ),

        fetchMovies(
          "/movie/popular",
          "popular"
        ),

        fetchMovies(
          "/movie/top_rated",
          "top_rated"
        ),

        fetchMovies(
          "/movie/upcoming",
          "upcoming"
        ),
      ]);

      const grouped = {
        now_playing: nowPlayingMovies,
        popular: popularMovies,
        top_rated: topRatedMovies,
        upcoming: upcomingMovies,
      };

      setMovies(grouped);

      /**
       * Combine all categories.
       */
      const allMovies = [
        ...nowPlayingMovies,
        ...popularMovies,
        ...topRatedMovies,
        ...upcomingMovies,
      ];

      /**
       * Remove duplicate movies.
       */
      const uniqueMovies = Array.from(
        new Map(
          allMovies.map((movie) => [
            movie.id,
            movie,
          ])
        ).values()
      );

      /**
       * Select random hero movie from
       * the first five suitable popular movies.
       */
      const heroPool = popularMovies
        .filter(
          (movie) =>
            movie.backdrop_path &&
            movie.overview
        )
        .slice(0, 5);

      if (heroPool.length > 0) {
        const randomHero =
          heroPool[
            Math.floor(
              Math.random() * heroPool.length
            )
          ];

        setHeroMovie(randomHero);
      } else {
        setHeroMovie(null);
      }

      /**
       * Recently Added
       *
       * Use release_date because TMDB does
       * not provide Base44 created_date.
       */
      const recent = [...uniqueMovies]
        .filter(
          (movie) => movie.release_date
        )
        .sort(
          (a, b) =>
            new Date(
              b.release_date
            ).getTime() -
            new Date(
              a.release_date
            ).getTime()
        )
        .slice(0, 12);

      setRecentlyAdded(recent);

      /**
       * Find languages represented in
       * currently loaded movies.
       */
      const langCodes = [
        ...new Set(
          uniqueMovies
            .map(
              (movie) =>
                movie.original_language
            )
            .filter(Boolean)
        ),
      ];

      const languages =
        LANGUAGES.filter((language) =>
          langCodes.includes(
            language.code
          )
        );

      setAvailableLanguages(languages);
    } catch (err) {
      console.error(
        "Failed to load movies:",
        err
      );

      setError(
        err.message ||
          "Unable to load movies."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] pt-20">
        <LoadingSpinner text="Loading movies..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
        <div className="max-w-lg text-center">
          <h1 className="mb-3 text-2xl font-bold">
            Unable to load movies
          </h1>

          <p className="mb-6 text-gray-400">
            {error}
          </p>

          <button
            type="button"
            onClick={loadMovies}
            className="rounded-lg bg-red-600 px-6 py-3 font-medium transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <HeroSection movie={heroMovie} />

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <GenreNav />

        <MovieGrid
          movies={movies.now_playing.slice(
            0,
            12
          )}
          title="Latest Movies"
        />

        <MovieGrid
          movies={recentlyAdded}
          title="Recently Added"
        />

        <MovieGrid
          movies={movies.popular.slice(
            0,
            12
          )}
          title="Popular Movies"
        />

        {availableLanguages.length > 0 && (
          <LanguageNav
            languages={availableLanguages}
          />
        )}

        <MovieGrid
          movies={movies.top_rated.slice(
            0,
            12
          )}
          title="Top Rated"
        />

        <MovieGrid
          movies={movies.upcoming.slice(
            0,
            12
          )}
          title="Upcoming"
        />

        <SeoContent />
      </div>
    </>
  );
}
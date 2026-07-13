import React, { useState, useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import MovieGrid from "@/components/MovieGrid";
import GenreNav from "@/components/GenreNav";
import LoadingSpinner from "@/components/LoadingSpinner";
import { SITE_NAME, SITE_TAGLINE, LANGUAGES } from "@/lib/constants";
import LanguageNav from "@/components/LanguageNav";
import SeoContent from "@/components/SeoContent";

const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function Home() {
  const [movies, setMovies] = useState({
    now_playing: [],
    popular: [],
    top_rated: [],
    upcoming: [],
  });

  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroMovie, setHeroMovie] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `${SITE_NAME} — ${SITE_TAGLINE}`;
    loadMovies();
  }, []);

  /**
   * Fetch a movie category from TMDB.
   */
  async function fetchMovies(endpoint, category) {
    const url =
      `${TMDB_API_URL}${endpoint}` +
      `?api_key=${TMDB_API_KEY}` +
      `&language=en-US` +
      `&page=1`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `TMDB request failed for ${category}: ${response.status}`
      );
    }

    const data = await response.json();

    return (data.results || []).map((movie) => {
  const titleSlug = movie.title
    ?.toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return {
    ...movie,
    category,
    tmdb_id: movie.id,
    movie_id: movie.id,
    slug: `${movie.id}-${titleSlug || "movie"}`,
    release_year: movie.release_date
      ? movie.release_date.substring(0, 4)
      : null,
  };
});
  }

  async function loadMovies() {
    try {
      setLoading(true);
      setError("");

      if (!TMDB_API_KEY) {
        throw new Error(
          "VITE_TMDB_API_KEY is missing. Add it to your .env file."
        );
      }

      // Fetch all movie sections in parallel
      const [
        nowPlayingMovies,
        popularMovies,
        topRatedMovies,
        upcomingMovies,
      ] = await Promise.all([
        fetchMovies("/movie/now_playing", "now_playing"),
        fetchMovies("/movie/popular", "popular"),
        fetchMovies("/movie/top_rated", "top_rated"),
        fetchMovies("/movie/upcoming", "upcoming"),
      ]);

      const grouped = {
        now_playing: nowPlayingMovies,
        popular: popularMovies,
        top_rated: topRatedMovies,
        upcoming: upcomingMovies,
      };

      setMovies(grouped);

      /**
       * Combine all movies and remove duplicates.
       */
      const allMovies = [
        ...nowPlayingMovies,
        ...popularMovies,
        ...topRatedMovies,
        ...upcomingMovies,
      ];

      const uniqueMovies = Array.from(
        new Map(allMovies.map((movie) => [movie.id, movie])).values()
      );

      /**
       * Select a hero movie.
       * Prefer popular movies that have both:
       * - backdrop image
       * - overview
       */
      const heroPool = popularMovies
        .filter((movie) => movie.backdrop_path && movie.overview)
        .slice(0, 5);

      if (heroPool.length > 0) {
        const randomHero =
          heroPool[Math.floor(Math.random() * heroPool.length)];

        setHeroMovie(randomHero);
      }

      /**
       * Recently Added
       *
       * TMDB does not provide Base44's created_date field,
       * so use release_date instead.
       */
      const recent = [...uniqueMovies]
        .filter((movie) => movie.release_date)
        .sort(
          (a, b) =>
            new Date(b.release_date).getTime() -
            new Date(a.release_date).getTime()
        )
        .slice(0, 12);

      setRecentlyAdded(recent);

      /**
       * Detect languages available in fetched movies.
       */
      const langCodes = [
        ...new Set(
          uniqueMovies
            .map((movie) => movie.original_language)
            .filter(Boolean)
        ),
      ];

      const languages = LANGUAGES.filter((language) =>
        langCodes.includes(language.code)
      );

      setAvailableLanguages(languages);
    } catch (err) {
      console.error("Failed to load movies:", err);
      setError(err.message || "Unable to load movies.");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Loading screen
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] pt-20">
        <LoadingSpinner text="Loading movies..." />
      </div>
    );
  }

  /**
   * Error screen
   */
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
        <div className="max-w-lg text-center">
          <h1 className="mb-3 text-2xl font-bold">
            Unable to load movies
          </h1>

          <p className="mb-6 text-gray-400">{error}</p>

          <button
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
          movies={movies.now_playing.slice(0, 12)}
          title="Latest Movies"
        />

        <MovieGrid
          movies={recentlyAdded}
          title="Recently Added"
        />

        <MovieGrid
          movies={movies.popular.slice(0, 12)}
          title="Popular Movies"
        />

        {availableLanguages.length > 0 && (
          <LanguageNav languages={availableLanguages} />
        )}

        <MovieGrid
          movies={movies.top_rated.slice(0, 12)}
          title="Top Rated"
        />

        <MovieGrid
          movies={movies.upcoming.slice(0, 12)}
          title="Upcoming"
        />

        <SeoContent />
      </div>
    </>
  );
}
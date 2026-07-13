import React from "react";
import { Link } from "react-router-dom";
import { Play, Star } from "lucide-react";
import { getBackdropUrl } from "@/lib/constants";

/**
 * Generate SEO-friendly movie URL.
 * Example: 1061474-superman
 */
function createMovieSlug(movie) {
  const movieId =
    movie?.id ||
    movie?.tmdb_id ||
    movie?.movie_id;

  if (!movieId) return null;

  const titleSlug = (movie?.title || "movie")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${movieId}-${titleSlug}`;
}

export default function HeroSection({ movie }) {
  if (!movie) return null;

  const backdropUrl = getBackdropUrl(
    movie.backdrop_path,
    "original"
  );

  const year = movie.release_date
    ? movie.release_date.substring(0, 4)
    : "";

  const rating = Number(movie.vote_average);

  const hasRating =
    Number.isFinite(rating) && rating > 0;

  /**
   * Use existing slug if available.
   * Otherwise generate one from TMDB ID.
   */
  const movieSlug =
    movie.slug ||
    movie.movieSlug ||
    createMovieSlug(movie);

  return (
    <section className="relative h-[85vh] min-h-[500px] w-full overflow-hidden">
      {/* Background */}
      {backdropUrl ? (
        <img
          src={backdropUrl}
          alt={`${movie.title || "Movie"} backdrop`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[#0a0a0a]" />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative flex h-full items-end pb-16 md:pb-20">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">

          {/* Metadata */}
          <div className="mb-3 flex items-center gap-3">
            {hasRating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />

                <span className="text-sm font-bold text-white">
                  {rating.toFixed(1)}
                </span>
              </div>
            )}

            {year && (
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4D4D4]">
                {year}
              </span>
            )}

            {movie.genre_names && (
              <span className="text-xs text-[#888]">
                {movie.genre_names
                  .split(",")
                  .slice(0, 2)
                  .join(" · ")}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="max-w-3xl text-4xl font-extrabold leading-none tracking-tight text-white md:text-6xl lg:text-7xl">
            {movie.title || "Untitled Movie"}
          </h1>

          {/* Overview */}
          {movie.overview && (
            <p className="mt-4 max-w-xl line-clamp-3 text-sm leading-relaxed text-[#D4D4D4] md:text-base">
              {movie.overview}
            </p>
          )}

          {/* CTA */}
          <div className="mt-6 flex items-center gap-3">
            {movieSlug ? (
              <Link
                to={`/movie/${movieSlug}`}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#050505] transition-all hover:bg-[#D4D4D4]"
              >
                <Play className="h-4 w-4 fill-current" />
                View Details
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-white/50 px-5 py-2.5 text-sm font-semibold text-[#050505]"
              >
                <Play className="h-4 w-4" />
                Details Unavailable
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
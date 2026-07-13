import React from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { getPosterUrl } from "@/lib/constants";

/**
 * Generate a safe SEO-friendly movie slug.
 * Example: 1083381-the-movie-title
 */
function createMovieSlug(movie) {
  const movieId =
    movie?.id ||
    movie?.tmdb_id ||
    movie?.movie_id;

  if (!movieId) {
    return null;
  }

  const titleSlug = (movie?.title || "movie")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${movieId}-${titleSlug}`;
}

export default function MovieCard({
  movie,
  featured = false,
}) {
  if (!movie) {
    return null;
  }

  /**
   * Use an existing slug when available.
   * Otherwise generate one from the TMDB ID.
   */
  const movieSlug =
    movie.slug ||
    movie.movieSlug ||
    createMovieSlug(movie);

  /**
   * Never create /movie/undefined.
   */
  if (!movieSlug) {
    console.error(
      "MovieCard: Cannot create movie URL because movie ID is missing:",
      movie
    );

    return null;
  }

  const posterUrl = getPosterUrl(
    movie.poster_path
  );

  const year =
    movie.release_year ||
    (movie.release_date
      ? movie.release_date.substring(0, 4)
      : "");

  const rating =
    movie.vote_average ??
    movie.rating;

  const hasValidRating =
    Number(rating) > 0;

  return (
    <Link
      to={`/movie/${movieSlug}`}
      className={`group relative block overflow-hidden rounded-lg bg-[#0F0F0F] transition-transform duration-300 hover:scale-[1.02] ${
        featured
          ? "col-span-2 row-span-2"
          : ""
      }`}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={`${movie.title || "Movie"} movie poster`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#1a1a1a]">
            <span className="text-sm text-[#555]">
              No Poster
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Rating badge */}
        {hasValidRating && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 backdrop-blur-sm">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />

            <span className="text-xs font-bold text-white">
              {Number(rating).toFixed(1)}
            </span>
          </div>
        )}

        {/* Bottom information on hover */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full p-3 transition-transform duration-300 group-hover:translate-y-0">
          <h3 className="line-clamp-2 text-sm font-semibold text-white">
            {movie.title || "Untitled Movie"}
          </h3>

          <div className="mt-1 flex items-center gap-2">
            {year && (
              <span className="text-xs font-medium tracking-wider text-[#D4D4D4]">
                {year}
              </span>
            )}

            {movie.genre_names && (
              <span className="text-xs text-[#888]">
                {movie.genre_names.split(",")[0]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Title below card */}
      <div className="p-2 pb-3">
        <h3 className="line-clamp-1 text-sm font-medium text-[#D4D4D4] transition-colors group-hover:text-white">
          {movie.title || "Untitled Movie"}
        </h3>

        {year && (
          <p className="mt-0.5 text-xs text-[#666]">
            {year}
          </p>
        )}
      </div>
    </Link>
  );
}
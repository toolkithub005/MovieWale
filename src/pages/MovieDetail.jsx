import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Star,
  Clock,
  Calendar,
  Globe,
  ExternalLink,
  Loader2,
} from "lucide-react";

import {
  getBackdropUrl,
  getPosterUrl,
  SITE_NAME,
} from "@/lib/constants";

import Breadcrumb from "@/components/Breadcrumb";
import MovieGrid from "@/components/MovieGrid";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

/*
 * All TMDB requests go through our Express server.
 *
 * Browser:
 * /api/tmdb/movie/123
 *
 * Express server:
 * https://api.themoviedb.org/3/movie/123
 */
const TMDB_API_URL = "/api/tmdb";

/*
 * ShrinkEarn is still browser-side for now.
 * We can move this server-side later.
 */
const SHRINKEARN_API_KEY =
  import.meta.env.VITE_SHRINKEARN_API_KEY;

/**
 * Generate SEO-friendly movie URL slug.
 *
 * Example:
 * 1083381-some-movie-title
 */
function createMovieSlug(movie) {
  if (!movie?.id) {
    return null;
  }

  const titleSlug = (movie.title || "movie")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${movie.id}-${titleSlug}`;
}

/**
 * Extract TMDB numeric ID from:
 *
 * 1083381
 * 1083381-movie-title
 */
function getMovieIdFromSlug(value) {
  if (!value) {
    return null;
  }

  const match = String(value).match(/^(\d+)/);

  return match ? match[1] : null;
}

/**
 * Call our server-side TMDB proxy.
 */
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
      // Ignore invalid JSON response
    }

    throw new Error(message);
  }

  return response.json();
}

/**
 * Create ShrinkEarn short URL.
 */
async function createShortLink(destinationUrl) {
  if (!SHRINKEARN_API_KEY) {
    throw new Error(
      "ShrinkEarn API key is missing."
    );
  }

  const params = new URLSearchParams({
    api: SHRINKEARN_API_KEY,
    url: destinationUrl,
  });

  const apiUrl =
    `https://shrinkearn.com/api?${params.toString()}`;

  const response = await fetch(apiUrl);

  const rawResponse =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `ShrinkEarn HTTP ${response.status}`
    );
  }

  /*
   * Some URL shorteners may return
   * the shortened URL directly.
   */
  if (
    rawResponse.trim().startsWith("http")
  ) {
    return rawResponse.trim();
  }

  let data;

  try {
    data = JSON.parse(rawResponse);
  } catch {
    throw new Error(
      "Invalid response from link service."
    );
  }

  const shortUrl =
    data.shortenedUrl ||
    data.shortened_url ||
    data.short_url ||
    data.url ||
    data.result;

  if (!shortUrl) {
    throw new Error(
      data.message ||
        data.error ||
        "No shortened URL returned."
    );
  }

  return shortUrl;
}

export default function MovieDetail() {
  /*
   * Supports route parameters named:
   *
   * /movie/:slug
   * /movie/:movieSlug
   * /movie/:id
   */
  const params = useParams();

  const routeValue =
    params.slug ||
    params.movieSlug ||
    params.id;

  const [movie, setMovie] =
    useState(null);

  const [related, setRelated] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [notFound, setNotFound] =
    useState(false);

  const [error, setError] =
    useState("");

  const [openingLink, setOpeningLink] =
    useState(false);

  const [linkError, setLinkError] =
    useState("");

  useEffect(() => {
    window.scrollTo(0, 0);

    loadMovie();
  }, [routeValue]);

  async function loadMovie() {
    setLoading(true);
    setNotFound(false);
    setMovie(null);
    setRelated([]);
    setError("");
    setLinkError("");

    try {
      /*
       * Extract numeric TMDB movie ID.
       */
      const movieId =
        getMovieIdFromSlug(routeValue);

      if (!movieId) {
        console.error(
          "Invalid movie URL:",
          routeValue
        );

        setNotFound(true);
        return;
      }

      /*
       * Fetch:
       *
       * Movie details
       * Credits
       * Videos
       * Recommendations
       */
      const data = await fetchTMDB(
        `/movie/${movieId}` +
          `?language=en-US` +
          `&append_to_response=credits,videos,recommendations`
      );

      /*
       * Find director.
       */
      const director =
        data.credits?.crew?.find(
          (person) =>
            person.job === "Director"
        )?.name || "";

      /*
       * Find best available YouTube trailer.
       */
      const videos =
        data.videos?.results || [];

      const trailer =
        videos.find(
          (video) =>
            video.site === "YouTube" &&
            video.type === "Trailer" &&
            video.official
        ) ||
        videos.find(
          (video) =>
            video.site === "YouTube" &&
            video.type === "Trailer"
        ) ||
        videos.find(
          (video) =>
            video.site === "YouTube"
        );

      /*
       * Normalize movie data so it remains
       * compatible with existing components.
       */
      const normalizedMovie = {
        ...data,

        id: data.id,
        tmdb_id: data.id,
        movie_id: data.id,

        slug:
          createMovieSlug(data),

        director,

        trailer_key:
          trailer?.key || null,

        release_year:
          data.release_date
            ? data.release_date.substring(
                0,
                4
              )
            : null,

        rating:
          data.vote_average,

        popularity:
          data.popularity,
      };

      setMovie(normalizedMovie);

      /*
       * Normalize related movies.
       *
       * Adding id + slug is important so
       * MovieGrid can generate valid links.
       */
      const normalizedRelated =
        (
          data.recommendations
            ?.results || []
        )
          .filter(
            (item) =>
              item.id &&
              item.title &&
              item.poster_path
          )
          .slice(0, 12)
          .map((item) => ({
            ...item,

            id: item.id,
            tmdb_id: item.id,
            movie_id: item.id,

            slug:
              createMovieSlug(item),

            release_year:
              item.release_date
                ? item.release_date.substring(
                    0,
                    4
                  )
                : null,

            rating:
              item.vote_average,

            popularity:
              item.popularity,
          }));

      setRelated(
        normalizedRelated
      );

      /*
       * SEO title.
       */
      const year =
        data.release_date
          ? data.release_date.substring(
              0,
              4
            )
          : "";

      document.title =
        `${data.title}` +
        `${year ? ` (${year})` : ""}` +
        ` – Cast, Trailer & Movie Details | ${SITE_NAME}`;

      /*
       * SEO description.
       */
      const description =
        data.overview
          ? data.overview.substring(
              0,
              160
            )
          : `${data.title} — cast, trailer and movie details on ${SITE_NAME}.`;

      let metaDescription =
        document.querySelector(
          'meta[name="description"]'
        );

      if (!metaDescription) {
        metaDescription =
          document.createElement(
            "meta"
          );

        metaDescription.name =
          "description";

        document.head.appendChild(
          metaDescription
        );
      }

      metaDescription.setAttribute(
        "content",
        description
      );
    } catch (err) {
      console.error(
        "Failed to load movie:",
        err
      );

      /*
       * 404 = movie does not exist.
       * Other errors should display separately.
       */
      if (
        err.message?.includes("404")
      ) {
        setNotFound(true);
      } else {
        setError(
          err.message ||
            "Unable to load movie."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleExternalLink() {
    if (
      !movie ||
      openingLink
    ) {
      return;
    }

    setOpeningLink(true);
    setLinkError("");

    try {
      /*
       * Current legitimate destination:
       * official TMDB movie information page.
       */
      const destinationUrl =
        `https://www.themoviedb.org/movie/${movie.id}`;

      const shortUrl =
        await createShortLink(
          destinationUrl
        );

      window.open(
        shortUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (err) {
      console.error(
        "Failed to create short link:",
        err
      );

      setLinkError(
        "Unable to open the external link. Please try again."
      );
    } finally {
      setOpeningLink(false);
    }
  }

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] pt-24">
        <LoadingSpinner text="Loading movie..." />
      </div>
    );
  }

  /*
   * Error
   */
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 pt-24 text-white">
        <div className="max-w-lg text-center">
          <h1 className="mb-3 text-2xl font-bold">
            Unable to load movie
          </h1>

          <p className="mb-6 text-[#888]">
            {error}
          </p>

          <button
            type="button"
            onClick={loadMovie}
            className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /*
   * Movie not found
   */
  if (
    notFound ||
    !movie
  ) {
    return (
      <div className="min-h-screen bg-[#050505] pt-24">
        <EmptyState
          title="Movie not found"
          message="The movie you're looking for doesn't exist."
        />
      </div>
    );
  }

  const backdropUrl =
    getBackdropUrl(
      movie.backdrop_path,
      "original"
    );

  const posterUrl =
    getPosterUrl(
      movie.poster_path,
      "large"
    );

  const formattedDate =
    movie.release_date
      ? new Date(
          movie.release_date
        ).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "short",
            day: "numeric",
          }
        )
      : "";

  const hasRating =
    Number(
      movie.vote_average
    ) > 0;

  const genres =
    movie.genres?.map(
      (genre) => genre.name
    ) || [];

  const castList =
    movie.credits?.cast?.slice(
      0,
      10
    ) || [];

  return (
    <>
      {/* Backdrop */}
      <div className="relative h-[50vh] min-h-[300px] w-full overflow-hidden md:h-[60vh]">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt={`${movie.title} backdrop`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[#0a0a0a]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Breadcrumb
          items={[
            {
              label: "Home",
              href: "/",
            },
            {
              label: "Movies",
              href: "/movies",
            },
            {
              label: movie.title,
            },
          ]}
        />

        <div className="grid gap-8 pb-12 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr]">
          {/* Poster */}
          <div className="relative z-10 -mt-32 md:-mt-40">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={`${movie.title} poster`}
                className="w-full rounded-lg shadow-2xl shadow-black/50"
              />
            ) : (
              <div className="flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-[#0F0F0F]">
                <span className="text-[#555]">
                  No Poster
                </span>
              </div>
            )}
          </div>

          {/* Movie information */}
          <div className="pt-2 md:pt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl lg:text-5xl">
              {movie.title}
            </h1>

            {/* Metadata */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              {hasRating && (
                <div className="flex items-center gap-1 rounded bg-yellow-400/10 px-2 py-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />

                  <span className="font-bold text-yellow-400">
                    {Number(
                      movie.vote_average
                    ).toFixed(1)}
                  </span>

                  {movie.vote_count > 0 && (
                    <span className="text-xs text-[#888]">
                      (
                      {movie.vote_count.toLocaleString()}{" "}
                      votes)
                    </span>
                  )}
                </div>
              )}

              {formattedDate && (
                <span className="flex items-center gap-1 text-[#D4D4D4]">
                  <Calendar className="h-3.5 w-3.5" />
                  {formattedDate}
                </span>
              )}

              {movie.runtime > 0 && (
                <span className="flex items-center gap-1 text-[#D4D4D4]">
                  <Clock className="h-3.5 w-3.5" />

                  {Math.floor(
                    movie.runtime / 60
                  )}
                  h{" "}
                  {movie.runtime % 60}
                  m
                </span>
              )}

              {movie.original_language && (
                <span className="flex items-center gap-1 text-[#D4D4D4]">
                  <Globe className="h-3.5 w-3.5" />

                  {movie.original_language.toUpperCase()}
                </span>
              )}
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {genres.map(
                  (genre) => (
                    <span
                      key={genre}
                      className="rounded-full border border-[#1a1a1a] px-3 py-1 text-xs font-medium text-[#D4D4D4]"
                    >
                      {genre}
                    </span>
                  )
                )}
              </div>
            )}

            {/* Synopsis */}
            {movie.overview && (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-[#555]">
                  Synopsis
                </h2>

                <p className="text-sm leading-relaxed text-[#D4D4D4] md:text-base">
                  {movie.overview}
                </p>
              </div>
            )}

            {/* Director */}
            {movie.director && (
              <div className="mt-5">
                <h2 className="mb-1 text-sm font-bold uppercase tracking-widest text-[#555]">
                  Director
                </h2>

                <p className="text-sm text-[#D4D4D4]">
                  {movie.director}
                </p>
              </div>
            )}

            {/* Cast */}
            {castList.length > 0 && (
              <div className="mt-5">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-[#555]">
                  Cast
                </h2>

                <div className="flex flex-wrap gap-2">
                  {castList.map(
                    (actor) => (
                      <span
                        key={actor.id}
                        className="rounded bg-[#0F0F0F] px-3 py-1.5 text-xs text-[#D4D4D4]"
                      >
                        {actor.name}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Trailer */}
            {movie.trailer_key && (
              <div className="mt-6">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#555]">
                  Trailer
                </h2>

                <div className="relative aspect-video w-full max-w-xl overflow-hidden rounded-lg">
                  <iframe
                    src={`https://www.youtube.com/embed/${movie.trailer_key}`}
                    title={`${movie.title} trailer`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* TMDB */}
            <div className="mt-6">
              <a
                href={`https://www.themoviedb.org/movie/${movie.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[#1a1a1a] px-4 py-2 text-sm text-[#888] transition-colors hover:border-[#333] hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
                View on TMDB
              </a>
            </div>

            {/* External link */}
            <div className="mt-6">
              <button
                type="button"
                onClick={
                  handleExternalLink
                }
                disabled={
                  openingLink
                }
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {openingLink ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Preparing link...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-5 w-5" />
                    Movie Link
                  </>
                )}
              </button>

              <p className="mt-3 max-w-xl text-xs leading-relaxed text-[#666]">
                You are leaving MovieWale
                and opening an external
                website. The external
                service may display
                advertising before reaching
                the destination.
              </p>

              {linkError && (
                <p className="mt-2 text-sm text-red-400">
                  {linkError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Related Movies */}
        {related.length > 0 && (
          <MovieGrid
            movies={related}
            title="Related Movies"
          />
        )}
      </div>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context":
              "https://schema.org",

            "@type": "Movie",

            name: movie.title,

            ...(movie.overview && {
              description:
                movie.overview,
            }),

            ...(posterUrl && {
              image: posterUrl,
            }),

            ...(movie.release_date && {
              datePublished:
                movie.release_date,
            }),

            ...(movie.director && {
              director: {
                "@type": "Person",
                name:
                  movie.director,
              },
            }),

            ...(castList.length > 0 && {
              actor:
                castList.map(
                  (actor) => ({
                    "@type":
                      "Person",

                    name:
                      actor.name,
                  })
                ),
            }),

            ...(genres.length > 0 && {
              genre: genres,
            }),

            ...(hasRating &&
              movie.vote_count > 0 && {
                aggregateRating: {
                  "@type":
                    "AggregateRating",

                  ratingValue:
                    movie.vote_average,

                  bestRating: 10,

                  ratingCount:
                    movie.vote_count,
                },
              }),
          }),
        }}
      />
    </>
  );
}
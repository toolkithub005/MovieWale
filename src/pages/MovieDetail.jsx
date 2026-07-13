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

const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const SHRINKEARN_API_KEY = import.meta.env.VITE_SHRINKEARN_API_KEY;

function createMovieSlug(movie) {
  const titleSlug = movie.title
    ?.toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${movie.id}-${titleSlug || "movie"}`;
}

function getMovieIdFromSlug(slug) {
  const match = slug?.match(/^(\d+)/);
  return match ? match[1] : null;
}

async function fetchTMDB(endpoint) {
  const separator = endpoint.includes("?") ? "&" : "?";

  const response = await fetch(
    `${TMDB_API_URL}${endpoint}${separator}api_key=${TMDB_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  return response.json();
}

async function createShortLink(destinationUrl) {
  if (!SHRINKEARN_API_KEY) {
    throw new Error("ShrinkEarn API key is missing.");
  }

  const params = new URLSearchParams({
    api: SHRINKEARN_API_KEY,
    url: destinationUrl,
  });

  const apiUrl = `https://shrinkearn.com/api?${params.toString()}`;

  const response = await fetch(apiUrl);

  const rawResponse = await response.text();

  console.log("ShrinkEarn status:", response.status);
  console.log("ShrinkEarn raw response:", rawResponse);

  if (!response.ok) {
    throw new Error(
      `ShrinkEarn HTTP ${response.status}: ${rawResponse}`
    );
  }

  let data;

  try {
    data = JSON.parse(rawResponse);
  } catch {
    // Some shortener APIs return the shortened URL as plain text
    if (rawResponse.startsWith("http")) {
      return rawResponse.trim();
    }

    throw new Error(
      `Unexpected ShrinkEarn response: ${rawResponse}`
    );
  }

  console.log("ShrinkEarn JSON:", data);

  // Support several possible response formats
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
        `No shortened URL returned: ${rawResponse}`
    );
  }

  return shortUrl;
}

export default function MovieDetail() {
  const { slug } = useParams();

  const [movie, setMovie] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [openingLink, setOpeningLink] = useState(false);
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    loadMovie();
    window.scrollTo(0, 0);
  }, [slug]);

  async function loadMovie() {
    setLoading(true);
    setNotFound(false);
    setMovie(null);
    setRelated([]);
    setLinkError("");

    try {
      if (!TMDB_API_KEY) {
        throw new Error("VITE_TMDB_API_KEY is missing.");
      }

      const movieId = getMovieIdFromSlug(slug);

      if (!movieId) {
        setNotFound(true);
        return;
      }

      const data = await fetchTMDB(
        `/movie/${movieId}?language=en-US&append_to_response=credits,videos,recommendations`
      );

      const director =
        data.credits?.crew?.find(
          (person) => person.job === "Director"
        )?.name || "";

      const videos = data.videos?.results || [];

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
        );

      const normalizedMovie = {
        ...data,
        tmdb_id: data.id,
        slug: createMovieSlug(data),
        director,
        trailer_key: trailer?.key || null,
      };

      setMovie(normalizedMovie);

      const normalizedRelated =
        data.recommendations?.results
          ?.filter((item) => item.poster_path)
          .slice(0, 6)
          .map((item) => ({
            ...item,
            tmdb_id: item.id,
            slug: createMovieSlug(item),
            release_year: item.release_date
              ? item.release_date.substring(0, 4)
              : null,
          })) || [];

      setRelated(normalizedRelated);

      const year = data.release_date
        ? data.release_date.substring(0, 4)
        : "";

      document.title =
        `${data.title}` +
        `${year ? ` (${year})` : ""}` +
        ` – Cast, Trailer & Movie Details | ${SITE_NAME}`;

      const description = data.overview
        ? data.overview.substring(0, 160)
        : `${data.title} — cast, trailer and movie details on ${SITE_NAME}.`;

      let metaDesc = document.querySelector(
        'meta[name="description"]'
      );

      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }

      metaDesc.setAttribute("content", description);
    } catch (error) {
      console.error("Failed to load movie:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleExternalLink() {
    if (!movie || openingLink) return;

    setOpeningLink(true);
    setLinkError("");

    try {
      /*
       * The actual destination after the ShrinkEarn
       * advertising/interstitial flow.
       *
       * Currently this goes to the movie's TMDB page.
       * Replace this later with another legitimate destination
       * if required.
       */
      const destinationUrl =
        `https://www.themoviedb.org/movie/${movie.id}`;

      const shortUrl = await createShortLink(destinationUrl);

      window.open(
        shortUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      console.error("Failed to create short link:", error);

      setLinkError(
        "Unable to open the external link. Please try again."
      );
    } finally {
      setOpeningLink(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] pt-24">
        <LoadingSpinner text="Loading movie..." />
      </div>
    );
  }

  if (notFound || !movie) {
    return (
      <div className="min-h-screen bg-[#050505] pt-24">
        <EmptyState
          title="Movie not found"
          message="The movie you're looking for doesn't exist."
        />
      </div>
    );
  }

  const backdropUrl = getBackdropUrl(
    movie.backdrop_path,
    "original"
  );

  const posterUrl = getPosterUrl(
    movie.poster_path,
    "large"
  );

  const formattedDate = movie.release_date
    ? new Date(movie.release_date).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      )
    : "";

  const hasRating = Number(movie.vote_average) > 0;

  const genres =
    movie.genres?.map((genre) => genre.name) || [];

  const castList =
    movie.credits?.cast?.slice(0, 10) || [];

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

          {/* Details */}
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
                    {Number(movie.vote_average).toFixed(1)}
                  </span>

                  {movie.vote_count > 0 && (
                    <span className="text-xs text-[#888]">
                      ({movie.vote_count.toLocaleString()} votes)
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

                  {Math.floor(movie.runtime / 60)}h{" "}
                  {movie.runtime % 60}m
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
                {genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-[#1a1a1a] px-3 py-1 text-xs font-medium text-[#D4D4D4]"
                  >
                    {genre}
                  </span>
                ))}
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
                  {castList.map((actor) => (
                    <span
                      key={actor.id}
                      className="rounded bg-[#0F0F0F] px-3 py-1.5 text-xs text-[#D4D4D4]"
                    >
                      {actor.name}
                    </span>
                  ))}
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

            {/* TMDB link */}
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

            {/* Monetized external link */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleExternalLink}
                disabled={openingLink}
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
                You are leaving MovieWale and opening an external
                website. The external service may display advertising
                before reaching the destination.
              </p>

              {linkError && (
                <p className="mt-2 text-sm text-red-400">
                  {linkError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Related movies */}
        {related.length > 0 && (
          <MovieGrid
            movies={related}
            title="Related Movies"
          />
        )}
      </div>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Movie",
            name: movie.title,

            ...(movie.overview && {
              description: movie.overview,
            }),

            ...(posterUrl && {
              image: posterUrl,
            }),

            ...(movie.release_date && {
              datePublished: movie.release_date,
            }),

            ...(movie.director && {
              director: {
                "@type": "Person",
                name: movie.director,
              },
            }),

            ...(castList.length > 0 && {
              actor: castList.map((actor) => ({
                "@type": "Person",
                name: actor.name,
              })),
            }),

            ...(genres.length > 0 && {
              genre: genres,
            }),

            ...(hasRating &&
              movie.vote_count > 0 && {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: movie.vote_average,
                  bestRating: 10,
                  ratingCount: movie.vote_count,
                },
              }),
          }),
        }}
      />
    </>
  );
}
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { SITE_NAME, LANGUAGES } from "@/lib/constants";
import Breadcrumb from "@/components/Breadcrumb";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

const TMDB_API_URL = "/api/tmdb";

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

export default function LanguagesPage() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `Browse Movies by Language | ${SITE_NAME}`;

    updateMetaDescription();
    loadCounts();

    window.scrollTo(0, 0);
  }, []);

  function updateMetaDescription() {
    const description =
      `Browse movies by language on ${SITE_NAME}. ` +
      "Discover English, Hindi, Tamil, Telugu, Malayalam and movies from around the world.";

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

  async function loadCounts() {
    setLoading(true);
    setError("");

    try {
      /*
       * Fetch several pages of popular movies.
       *
       * These counts represent movies found in the fetched
       * TMDB result set, not TMDB's complete database.
       */
      const pages = [1, 2, 3, 4, 5];

      const requests = pages.map((page) =>
        fetchTMDB(
          `/movie/popular?language=en-US&page=${page}`
        )
      );

      const responses = await Promise.all(requests);

      const allMovies = responses.flatMap(
        (response) => response.results || []
      );

      /*
       * Remove duplicate movies.
       */
      const uniqueMovies = Array.from(
        new Map(
          allMovies.map((movie) => [movie.id, movie])
        ).values()
      );

      /*
       * Count movies by original language.
       */
      const languageCounts = {};

      uniqueMovies.forEach((movie) => {
        if (movie.original_language) {
          languageCounts[movie.original_language] =
            (languageCounts[movie.original_language] || 0) + 1;
        }
      });

      setCounts(languageCounts);
    } catch (err) {
      console.error("Failed to load languages:", err);

      setError(
        err.message || "Unable to load languages."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Show configured languages that exist in the
   * fetched TMDB movie sample.
   */
  const available = LANGUAGES
    .filter((language) => counts[language.code] > 0)
    .sort(
      (a, b) =>
        (counts[b.code] || 0) - (counts[a.code] || 0)
    );

  return (
    <div className="min-h-screen bg-[#050505] pt-20">
      <div className="mx-auto max-w-5xl px-4 md:px-6">

        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            {
              label: "Home",
              href: "/",
            },
            {
              label: "Languages",
            },
          ]}
        />

        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Browse by Language
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#888] md:text-base">
            Discover movies from around the world,
            organized by their original language.
          </p>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="py-20">
            <LoadingSpinner text="Loading languages..." />
          </div>
        ) : error ? (
          <div className="py-20">
            <EmptyState
              title="Unable to load languages"
              message={error}
            />

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={loadCounts}
                className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : available.length === 0 ? (
          <div className="py-20">
            <EmptyState
              title="No languages found"
              message="No movie languages are currently available."
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((lang) => (
              <Link
                key={lang.code}
                to={`/language/${lang.slug}`}
                className="group flex items-center justify-between rounded-xl border border-[#1a1a1a] bg-[#0F0F0F] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5D5DFF] hover:bg-[#5D5DFF]/5"
              >
                <div>
                  <h2 className="text-lg font-bold text-white transition-colors group-hover:text-[#5D5DFF]">
                    {lang.name}
                  </h2>

                  <p className="mt-1 text-xs text-[#888]">
                    {counts[lang.code]}{" "}
                    {counts[lang.code] === 1
                      ? "popular movie"
                      : "popular movies"}
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className="text-2xl font-bold text-[#333] transition-all group-hover:translate-x-1 group-hover:text-[#5D5DFF]"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
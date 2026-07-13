import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { SITE_NAME, getLanguageBySlug } from "@/lib/constants";
import MovieGrid from "@/components/MovieGrid";
import Breadcrumb from "@/components/Breadcrumb";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

export default function LanguageDetailPage() {
  const { langSlug } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const lang = getLanguageBySlug(langSlug);

  useEffect(() => {
    if (lang) {
      document.title = `${lang.name} Movies | ${SITE_NAME}`;
      loadMovies();
    }
    window.scrollTo(0, 0);
  }, [langSlug]);

  async function loadMovies() {
    if (!lang) return;
    setLoading(true);
    try {
      const all = await base44.entities.Movie.list("-popularity", 500);
      setMovies(all.filter((m) => m.original_language === lang.code));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!lang) {
    return (
      <div className="min-h-screen bg-[#050505] pt-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <EmptyState title="Language not found" message="The language you're looking for doesn't exist." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Languages", href: "/languages" }, { label: lang.name }]} />

        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">{lang.name} Movies</h1>
        <p className="mt-2 text-sm text-[#888]">Discover movies in {lang.name}</p>

        <div className="mt-8">
          {loading ? (
            <LoadingSpinner text="Loading movies..." />
          ) : movies.length === 0 ? (
            <EmptyState title="No movies found" message={`No ${lang.name} movies available right now.`} />
          ) : (
            <>
              <p className="mb-4 text-sm text-[#888]">{movies.length} movie{movies.length !== 1 ? "s" : ""} found</p>
              <MovieGrid movies={movies} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
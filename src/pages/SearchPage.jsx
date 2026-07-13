import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, Filter } from "lucide-react";
import { SITE_NAME, LANGUAGES, getLanguageName } from "@/lib/constants";
import MovieGrid from "@/components/MovieGrid";
import Breadcrumb from "@/components/Breadcrumb";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

export default function SearchPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState("");
  const [langFilter, setLangFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = initialQuery ? `Search: ${initialQuery} | ${SITE_NAME}` : `Search Movies | ${SITE_NAME}`;
    loadMovies();
  }, []);

  async function loadMovies() {
    try {
      const all = await base44.entities.Movie.list("-popularity", 500);
      setAllMovies(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Compute available years and languages from data
  const availableYears = useMemo(() => {
    const years = [...new Set(
      allMovies
        .map((m) => (m.release_date ? m.release_date.substring(0, 4) : null))
        .filter(Boolean)
    )].sort((a, b) => b - a);
    return years;
  }, [allMovies]);

  const availableLangs = useMemo(() => {
    const codes = [...new Set(allMovies.map((m) => m.original_language).filter(Boolean))];
    return LANGUAGES.filter((l) => codes.includes(l.code));
  }, [allMovies]);

  // Filter results based on query, year, and language
  const results = useMemo(() => {
    const lowerQ = query.toLowerCase();
    return allMovies.filter((m) => {
      // Text search
      if (lowerQ) {
        const searchFields = [m.title, m.genre_names, m.original_language, m.director, m.cast, m.release_date]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchFields.includes(lowerQ)) return false;
      }
      // Year filter
      if (yearFilter && (!m.release_date || !m.release_date.startsWith(yearFilter))) return false;
      // Language filter
      if (langFilter && m.original_language !== langFilter) return false;
      return true;
    });
  }, [allMovies, query, yearFilter, langFilter]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`, { replace: true });
  }

  const hasSearched = query || yearFilter || langFilter;

  return (
    <div className="min-h-screen bg-[#050505] pt-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Search" }]} />

        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">Search Movies</h1>

        {/* Search input */}
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#555]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, genre, director, cast..."
              className="w-full rounded-lg border border-[#1a1a1a] bg-[#0F0F0F] py-3 pl-12 pr-4 text-white placeholder-[#555] focus:border-[#5D5DFF] focus:outline-none"
            />
          </div>
        </form>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-[#888]">
            <Filter className="h-4 w-4" /> Filters:
          </div>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-lg border border-[#1a1a1a] bg-[#0F0F0F] px-3 py-2 text-sm text-white focus:border-[#5D5DFF] focus:outline-none"
          >
            <option value="">All Years</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="rounded-lg border border-[#1a1a1a] bg-[#0F0F0F] px-3 py-2 text-sm text-white focus:border-[#5D5DFF] focus:outline-none"
          >
            <option value="">All Languages</option>
            {availableLangs.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
          {hasSearched && (
            <button
              onClick={() => { setQuery(""); setYearFilter(""); setLangFilter(""); }}
              className="text-sm text-[#5D5DFF] hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="mt-8">
          {loading ? (
            <LoadingSpinner text="Loading movies..." />
          ) : hasSearched && results.length === 0 ? (
            <EmptyState
              title="No results found"
              message={`No movies match your search. Try a different title, genre, year, or language.`}
            />
          ) : results.length > 0 ? (
            <>
              <p className="mb-4 text-sm text-[#888]">{results.length} result{results.length !== 1 ? "s" : ""} found</p>
              <MovieGrid movies={results} />
            </>
          ) : (
            <p className="text-sm text-[#888]">Start typing or select a filter to search our movie collection.</p>
          )}
        </div>
      </div>
    </div>
  );
}
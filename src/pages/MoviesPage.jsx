import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import MovieGrid from "@/components/MovieGrid";
import Breadcrumb from "@/components/Breadcrumb";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { SITE_NAME, CATEGORIES } from "@/lib/constants";

const PAGE_SIZE = 24;

export default function MoviesPage() {
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    document.title = `All Movies | ${SITE_NAME}`;
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

  const filtered = category === "all"
    ? allMovies
    : allMovies.filter((m) => m.category === category);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-[#050505] pt-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Movies" }]} />

        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">All Movies</h1>
        <p className="mt-2 text-sm text-[#888]">Browse our complete movie collection</p>

        {/* Category filter */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => { setCategory("all"); setVisibleCount(PAGE_SIZE); }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              category === "all"
                ? "bg-white text-[#050505]"
                : "border border-[#1a1a1a] bg-[#0F0F0F] text-[#D4D4D4] hover:text-white"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => { setCategory(cat.key); setVisibleCount(PAGE_SIZE); }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                category === cat.key
                  ? "bg-white text-[#050505]"
                  : "border border-[#1a1a1a] bg-[#0F0F0F] text-[#D4D4D4] hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {loading ? (
            <LoadingSpinner text="Loading movies..." />
          ) : visible.length === 0 ? (
            <EmptyState title="No movies found" message="No movies match this filter." />
          ) : (
            <>
              <p className="mb-4 text-sm text-[#888]">
                Showing {visible.length} of {filtered.length} movies
              </p>
              <MovieGrid movies={visible} />
              {visibleCount < filtered.length && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="rounded-lg border border-[#1a1a1a] bg-[#0F0F0F] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1a1a1a]"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
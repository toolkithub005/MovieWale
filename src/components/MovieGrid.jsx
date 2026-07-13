import React from "react";
import MovieCard from "@/components/MovieCard";

export default function MovieGrid({ movies, title, showFeatured = false }) {
  if (!movies || movies.length === 0) return null;

  return (
    <section className="py-8 md:py-12">
      {title && (
        <div className="mb-6 flex items-center gap-4">
          <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">{title}</h2>
          <div className="h-px flex-1 bg-[#1a1a1a]" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {movies.map((movie, i) => (
          <MovieCard
            key={movie.id || movie.tmdb_id || i}
            movie={movie}
            featured={showFeatured && i === 0}
          />
        ))}
      </div>
    </section>
  );
}
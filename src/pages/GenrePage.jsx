import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { GENRES, SITE_NAME } from "@/lib/constants";
import MovieGrid from "@/components/MovieGrid";
import GenreNav from "@/components/GenreNav";
import Breadcrumb from "@/components/Breadcrumb";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

export default function GenrePage() {
  const { genreSlug } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const genre = GENRES.find((g) => g.slug === genreSlug);
  const genreName = genre ? genre.name : genreSlug;

  useEffect(() => {
    document.title = `${genreName} Movies | ${SITE_NAME}`;
    loadMovies();
    window.scrollTo(0, 0);
  }, [genreSlug]);

  async function loadMovies() {
    setLoading(true);
    try {
      const all = await base44.entities.Movie.list("-popularity", 200);
      const filtered = all.filter((m) => {
        if (!m.genre_names) return false;
        return m.genre_names.toLowerCase().includes(genreName.toLowerCase());
      });
      setMovies(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: `${genreName} Movies` }]} />
        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">{genreName} Movies</h1>
        <GenreNav activeGenre={genreSlug} />

        {loading ? (
          <LoadingSpinner text={`Loading ${genreName} movies...`} />
        ) : movies.length === 0 ? (
          <EmptyState title={`No ${genreName} movies found`} message="We'll add more movies soon." />
        ) : (
          <MovieGrid movies={movies} />
        )}
      </div>
    </div>
  );
}
import React from "react";
import { Link } from "react-router-dom";
import { SITE_NAME, GENRES } from "@/lib/constants";

export default function SeoContent() {
  const topGenres = GENRES.slice(0, 12);

  return (
    <section className="mb-12 mt-12 border-t border-[#1a1a1a] pt-10">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-2xl font-bold text-white md:text-3xl">
          About {SITE_NAME}
        </h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-[#888] md:text-base">
          <p>
            {SITE_NAME} is a modern movie discovery platform where you can explore thousands of films from around the world.
            Whether you are looking for the latest blockbusters, timeless classics, or hidden gems across different genres and
            languages, {SITE_NAME} helps you find exactly what to watch next.
          </p>
          <p>
            Browse our extensive movie database by genre, language, or release year. Each movie page features a detailed synopsis,
            cast and director information, official trailers, IMDb-style ratings, and related movie recommendations. Our
            curated categories — including Now Playing, Popular, Top Rated, and Upcoming — make it easy to stay up to date with
            the world of cinema.
          </p>
          <p>
            {SITE_NAME} is an informational website. We do not host or stream any movie files. All movie data, posters, and
            backdrops are sourced from The Movie Database (TMDB). External links are clearly labeled and open in a new tab.
            {SITE_NAME} is not responsible for third-party website content.
          </p>
        </div>

        <h3 className="mt-8 text-lg font-bold text-white">Explore by Genre</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {topGenres.map((genre) => (
            <Link
              key={genre.slug}
              to={`/genre/${genre.slug}`}
              className="rounded-lg border border-[#1a1a1a] bg-[#0F0F0F] px-3 py-1.5 text-sm text-[#888] transition-colors hover:border-[#333] hover:text-white"
            >
              {genre.name} Movies
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
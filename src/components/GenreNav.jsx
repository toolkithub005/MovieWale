import React from "react";
import { Link } from "react-router-dom";
import { GENRES } from "@/lib/constants";

export default function GenreNav({ activeGenre }) {
  return (
    <nav className="py-4" aria-label="Genre navigation">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {GENRES.map((genre) => (
          <Link
            key={genre.slug}
            to={`/genre/${genre.slug}`}
            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
              activeGenre === genre.slug
                ? "border-[#5D5DFF] bg-[#5D5DFF]/10 text-[#5D5DFF]"
                : "border-[#1a1a1a] text-[#888] hover:border-[#333] hover:text-white"
            }`}
          >
            {genre.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
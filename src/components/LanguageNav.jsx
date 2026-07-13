import React from "react";
import { Link } from "react-router-dom";
import { LANGUAGES } from "@/lib/constants";

export default function LanguageNav({ languages = LANGUAGES }) {
  if (!languages || languages.length === 0) return null;

  return (
    <section className="mb-10 mt-8">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-bold text-white md:text-2xl">Browse by Language</h2>
        <Link to="/languages" className="text-sm font-medium text-[#5D5DFF] hover:underline">
          View all
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {languages.map((lang) => (
          <Link
            key={lang.code}
            to={`/language/${lang.slug}`}
            className="rounded-full border border-[#1a1a1a] bg-[#0F0F0F] px-4 py-2 text-sm font-medium text-[#D4D4D4] transition-colors hover:border-[#5D5DFF] hover:bg-[#5D5DFF]/10 hover:text-white"
          >
            {lang.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
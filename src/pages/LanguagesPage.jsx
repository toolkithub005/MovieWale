import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { SITE_NAME, LANGUAGES } from "@/lib/constants";
import Breadcrumb from "@/components/Breadcrumb";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function LanguagesPage() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `Browse Movies by Language | ${SITE_NAME}`;
    loadCounts();
  }, []);

  async function loadCounts() {
    try {
      const all = await base44.entities.Movie.list("-popularity", 500);
      const map = {};
      all.forEach((m) => {
        if (m.original_language) {
          map[m.original_language] = (map[m.original_language] || 0) + 1;
        }
      });
      setCounts(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const available = LANGUAGES.filter((l) => counts[l.code] > 0).sort((a, b) => counts[b.code] - counts[a.code]);

  return (
    <div className="min-h-screen bg-[#050505] pt-20">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Languages" }]} />

        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">Browse by Language</h1>
        <p className="mt-2 text-sm text-[#888]">Discover movies from around the world, organized by language</p>

        {loading ? (
          <LoadingSpinner text="Loading languages..." />
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((lang) => (
              <Link
                key={lang.code}
                to={`/language/${lang.slug}`}
                className="group flex items-center justify-between rounded-xl border border-[#1a1a1a] bg-[#0F0F0F] p-5 transition-colors hover:border-[#5D5DFF] hover:bg-[#5D5DFF]/5"
              >
                <div>
                  <h2 className="text-lg font-bold text-white group-hover:text-[#5D5DFF]">{lang.name}</h2>
                  <p className="mt-1 text-xs text-[#888]">{counts[lang.code]} movie{counts[lang.code] !== 1 ? "s" : ""}</p>
                </div>
                <span className="text-2xl font-bold text-[#1a1a1a] group-hover:text-[#5D5DFF]">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import React from "react";
import { Link } from "react-router-dom";
import { Film } from "lucide-react";
import { SITE_NAME, SITE_TAGLINE, GENRES } from "@/lib/constants";

export default function Footer() {
  const topGenres = GENRES.slice(0, 8);

  return (
    <footer className="border-t border-[#1a1a1a] bg-[#050505] mt-16">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <Film className="h-6 w-6 text-[#5D5DFF]" />
              <span className="text-lg font-extrabold text-white">{SITE_NAME}</span>
            </Link>
            <p className="text-sm leading-relaxed text-[#888]">{SITE_TAGLINE}</p>
          </div>

          {/* Genres */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#555]">Genres</h3>
            <ul className="space-y-1.5">
              {topGenres.map((genre) => (
                <li key={genre.slug}>
                  <Link to={`/genre/${genre.slug}`} className="text-sm text-[#888] transition-colors hover:text-white">
                    {genre.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#555]">Explore</h3>
            <ul className="space-y-1.5">
              <li><Link to="/" className="text-sm text-[#888] transition-colors hover:text-white">Home</Link></li>
              <li><Link to="/movies" className="text-sm text-[#888] transition-colors hover:text-white">All Movies</Link></li>
              <li><Link to="/languages" className="text-sm text-[#888] transition-colors hover:text-white">Languages</Link></li>
              <li><Link to="/search" className="text-sm text-[#888] transition-colors hover:text-white">Search</Link></li>
              <li><Link to="/about" className="text-sm text-[#888] transition-colors hover:text-white">About</Link></li>
              <li><Link to="/contact" className="text-sm text-[#888] transition-colors hover:text-white">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#555]">Legal</h3>
            <ul className="space-y-1.5">
              <li><Link to="/privacy" className="text-sm text-[#888] transition-colors hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-[#888] transition-colors hover:text-white">Terms & Conditions</Link></li>
              <li><Link to="/disclaimer" className="text-sm text-[#888] transition-colors hover:text-white">Disclaimer</Link></li>
              <li><Link to="/dmca" className="text-sm text-[#888] transition-colors hover:text-white">DMCA</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[#1a1a1a] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#555]">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-[#555]">
            Movie data powered by TMDB. This site is not endorsed by or affiliated with TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, Menu, Film } from "lucide-react";
import { SITE_NAME, GENRES } from "@/lib/constants";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery("");
    }
  };

  const topGenres = GENRES.slice(0, 8);

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-[#050505]/95 backdrop-blur-md shadow-lg shadow-black/20" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" aria-label="MovieWale home">
            <Film className="h-7 w-7 text-[#5D5DFF] transition-transform group-hover:rotate-12" />
            <span className="text-xl font-extrabold tracking-tight text-white">
              {SITE_NAME}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
            <Link to="/" className="text-sm font-medium text-[#D4D4D4] transition-colors hover:text-white">
              Home
            </Link>
            <div className="relative group">
              <button className="text-sm font-medium text-[#D4D4D4] transition-colors hover:text-white">
                Genres
              </button>
              <div className="absolute left-1/2 top-full hidden -translate-x-1/2 pt-2 group-hover:block">
                <div className="grid w-72 grid-cols-2 gap-1 rounded-lg border border-[#1a1a1a] bg-[#0F0F0F] p-3 shadow-2xl">
                  {GENRES.map((genre) => (
                    <Link
                      key={genre.slug}
                      to={`/genre/${genre.slug}`}
                      className="rounded px-3 py-2 text-sm text-[#D4D4D4] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link to="/movies" className="text-sm font-medium text-[#D4D4D4] transition-colors hover:text-white">
              Movies
            </Link>
            <Link to="/languages" className="text-sm font-medium text-[#D4D4D4] transition-colors hover:text-white">
              Languages
            </Link>
            <Link to="/about" className="text-sm font-medium text-[#D4D4D4] transition-colors hover:text-white">
              About
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-full p-2 text-[#D4D4D4] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              aria-label="Open search"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-full p-2 text-[#D4D4D4] transition-colors hover:bg-[#1a1a1a] hover:text-white md:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-[#1a1a1a] bg-[#0a0a0a] px-4 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="rounded px-3 py-2 text-sm text-[#D4D4D4] hover:bg-[#1a1a1a] hover:text-white">Home</Link>
              <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#555]">Genres</div>
              <div className="grid grid-cols-2 gap-1">
                {topGenres.map((genre) => (
                  <Link
                    key={genre.slug}
                    to={`/genre/${genre.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded px-3 py-2 text-sm text-[#D4D4D4] hover:bg-[#1a1a1a] hover:text-white"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
              <Link to="/movies" onClick={() => setMobileMenuOpen(false)} className="rounded px-3 py-2 text-sm text-[#D4D4D4] hover:bg-[#1a1a1a] hover:text-white">Movies</Link>
              <Link to="/languages" onClick={() => setMobileMenuOpen(false)} className="rounded px-3 py-2 text-sm text-[#D4D4D4] hover:bg-[#1a1a1a] hover:text-white">Languages</Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="rounded px-3 py-2 text-sm text-[#D4D4D4] hover:bg-[#1a1a1a] hover:text-white">About</Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="rounded px-3 py-2 text-sm text-[#D4D4D4] hover:bg-[#1a1a1a] hover:text-white">Contact</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/80 backdrop-blur-sm pt-[20vh]">
          <div className="mx-4 w-full max-w-2xl">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#555]" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies..."
                className="w-full rounded-xl border border-[#1a1a1a] bg-[#0F0F0F] py-4 pl-12 pr-12 text-lg text-white placeholder-[#555] focus:border-[#5D5DFF] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setQuery(""); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-white"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </form>
            <p className="mt-3 text-center text-xs text-[#555]">Press Enter to search</p>
          </div>
        </div>
      )}
    </>
  );
}
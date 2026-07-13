export const SITE_NAME = "MovieWale";
export const SITE_TAGLINE = "Discover Movies, Trailers, Reviews & Entertainment";
export const SITE_DESCRIPTION = "MovieWale — Your ultimate destination for discovering movies, watching trailers, reading reviews, and finding where to watch your favorite films.";

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
export const TMDB_POSTER_SIZES = {
  small: "/w185",
  medium: "/w342",
  large: "/w500",
  original: "/original",
};
export const TMDB_BACKDROP_SIZES = {
  small: "/w780",
  large: "/w1280",
  original: "/original",
};

export const GENRES = [
  { id: 28, name: "Action", slug: "action" },
  { id: 12, name: "Adventure", slug: "adventure" },
  { id: 16, name: "Animation", slug: "animation" },
  { id: 35, name: "Comedy", slug: "comedy" },
  { id: 80, name: "Crime", slug: "crime" },
  { id: 99, name: "Documentary", slug: "documentary" },
  { id: 18, name: "Drama", slug: "drama" },
  { id: 10751, name: "Family", slug: "family" },
  { id: 14, name: "Fantasy", slug: "fantasy" },
  { id: 36, name: "History", slug: "history" },
  { id: 27, name: "Horror", slug: "horror" },
  { id: 10402, name: "Music", slug: "music" },
  { id: 9648, name: "Mystery", slug: "mystery" },
  { id: 10749, name: "Romance", slug: "romance" },
  { id: 878, name: "Sci-Fi", slug: "science-fiction" },
  { id: 53, name: "Thriller", slug: "thriller" },
  { id: 10752, name: "War", slug: "war" },
  { id: 37, name: "Western", slug: "western" },
];

export const LANGUAGES = [
  { code: "en", name: "English", slug: "english" },
  { code: "hi", name: "Hindi", slug: "hindi" },
  { code: "ja", name: "Japanese", slug: "japanese" },
  { code: "ko", name: "Korean", slug: "korean" },
  { code: "es", name: "Spanish", slug: "spanish" },
  { code: "fr", name: "French", slug: "french" },
  { code: "de", name: "German", slug: "german" },
  { code: "it", name: "Italian", slug: "italian" },
  { code: "zh", name: "Chinese", slug: "chinese" },
  { code: "ta", name: "Tamil", slug: "tamil" },
  { code: "te", name: "Telugu", slug: "telugu" },
  { code: "ml", name: "Malayalam", slug: "malayalam" },
  { code: "kn", name: "Kannada", slug: "kannada" },
  { code: "bn", name: "Bengali", slug: "bengali" },
  { code: "pa", name: "Punjabi", slug: "punjabi" },
  { code: "mr", name: "Marathi", slug: "marathi" },
  { code: "ru", name: "Russian", slug: "russian" },
  { code: "pt", name: "Portuguese", slug: "portuguese" },
  { code: "tr", name: "Turkish", slug: "turkish" },
  { code: "ar", name: "Arabic", slug: "arabic" },
  { code: "th", name: "Thai", slug: "thai" },
  { code: "id", name: "Indonesian", slug: "indonesian" },
];

export function getLanguageName(code) {
  const lang = LANGUAGES.find((l) => l.code === code);
  return lang ? lang.name : code ? code.toUpperCase() : null;
}

export function getLanguageBySlug(slug) {
  return LANGUAGES.find((l) => l.slug === slug);
}

export const CATEGORIES = [
  { key: "now_playing", label: "Now Playing" },
  { key: "popular", label: "Popular" },
  { key: "top_rated", label: "Top Rated" },
  { key: "upcoming", label: "Upcoming" },
];

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function getGenreNameById(id) {
  const genre = GENRES.find((g) => g.id === id);
  return genre ? genre.name : null;
}

export function getPosterUrl(path, size = "large") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}${TMDB_POSTER_SIZES[size]}${path}`;
}

export function getBackdropUrl(path, size = "large") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}${TMDB_BACKDROP_SIZES[size]}${path}`;
}
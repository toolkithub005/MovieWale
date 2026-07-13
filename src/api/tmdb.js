const API_URL = "https://api.themoviedb.org/3";

const apiKey = import.meta.env.VITE_TMDB_API_KEY;

async function fetchTMDB(endpoint) {
  const separator = endpoint.includes("?") ? "&" : "?";

  const response = await fetch(
    `${API_URL}${endpoint}${separator}api_key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  return response.json();
}

export const tmdbApi = {
  getNowPlaying: (page = 1) =>
    fetchTMDB(`/movie/now_playing?language=en-US&page=${page}`),

  getPopular: (page = 1) =>
    fetchTMDB(`/movie/popular?language=en-US&page=${page}`),

  getTopRated: (page = 1) =>
    fetchTMDB(`/movie/top_rated?language=en-US&page=${page}`),

  getUpcoming: (page = 1) =>
    fetchTMDB(`/movie/upcoming?language=en-US&page=${page}`),

  getMovieDetails: (id) =>
    fetchTMDB(`/movie/${id}?language=en-US`),

  searchMovies: (query, page = 1) =>
    fetchTMDB(
      `/search/movie?query=${encodeURIComponent(query)}&page=${page}`
    ),
};

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
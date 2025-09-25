/* TMDB API Interactions */
import { API_KEY, TMDB_BASE, APP_CONFIG } from './config.js';

// Abort controllers for managing concurrent requests
const abortControllers = new Map();

/* Utility Functions */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/* Core Fetch Function */
async function fetchJson(path, params = {}, abortKey = null) {
  const url = new URL(TMDB_BASE + path, window.location.origin);
  //url.searchParams.set('api_key', API_KEY);
  
  Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) url.searchParams.set(k, v.join(','));
    else if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  // Abort only within the same key (e.g., list queries). Modal concurrent fetches use different keys or null.
  const controller = new AbortController();
  if (abortKey) {
    const prev = abortControllers.get(abortKey);
    if (prev) prev.abort();
    abortControllers.set(abortKey, controller);
  }

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return null;
    throw err;
  }
}

/* Movie Data Fetching */
export async function getPopularMovies(page = 1) {
  const data = await fetchJson('/movie/popular', { page }, 'list');
  if (!data) return null;
  return {
    movies: data.results || [],
    totalPages: clamp(data.total_pages || 1, 1, APP_CONFIG.MAX_PAGES),
    totalResults: data.total_results || 0
  };
}

export async function searchMovies(query, page = 1) {
  if (!query) return null;
  const data = await fetchJson('/search/movie', { 
    query, 
    page, 
    include_adult: false 
  }, 'list');
  if (!data) return null;
  return {
    movies: data.results || [],
    totalPages: clamp(data.total_pages || 1, 1, APP_CONFIG.MAX_PAGES),
    totalResults: data.total_results || 0
  };
}

export async function discoverMovies(page = 1, sortBy = 'popularity.desc', genres = []) {
  const data = await fetchJson('/discover/movie', {
    page,
    sort_by: sortBy,
    with_genres: Array.from(genres),
    include_adult: false,
  }, 'list');
  if (!data) return null;
  return {
    movies: data.results || [],
    totalPages: clamp(data.total_pages || 1, 1, APP_CONFIG.MAX_PAGES),
    totalResults: data.total_results || 0
  };
}

export async function getGenres() {
  const data = await fetchJson('/genre/movie/list', { language: 'en-US' });
  return data?.genres || [];
}

/* Movie Details Fetching */
export async function getMovieDetails(movieId) {
  return await fetchJson(`/movie/${movieId}`);
}

export async function getMovieVideos(movieId) {
  const data = await fetchJson(`/movie/${movieId}/videos`);
  return data?.results || [];
}

export async function getMovieCredits(movieId) {
  const data = await fetchJson(`/movie/${movieId}/credits`);
  return {
    cast: data?.cast || [],
    crew: data?.crew || []
  };
}

export async function getSimilarMovies(movieId) {
  const data = await fetchJson(`/movie/${movieId}/similar`);
  return data?.results || [];
}

/* Combined Movie Details */
export async function getCompleteMovieDetails(movieId) {
  try {
    const [details, videos, credits, similar] = await Promise.all([
      getMovieDetails(movieId),
      getMovieVideos(movieId),
      getMovieCredits(movieId),
      getSimilarMovies(movieId)
    ]);
    
    return {
      details,
      videos,
      credits,
      similar
    };
  } catch (error) {
    console.error('Error fetching complete movie details:', error);
    throw error;
  }
}

/* Client-side Sorting for Search Results */
export function applyClientSort(movies, sortBy) {
  const list = [...movies];
  const safeNum = (v, fallback = -Infinity) => (v === undefined || v === null ? fallback : v);
  
  switch (sortBy) {
    case 'vote_average.desc':
      return list.sort((a, b) => safeNum(b.vote_average) - safeNum(a.vote_average));
    case 'release_date.desc':
      return list.sort((a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0));
    case 'revenue.desc':
      return list.sort((a, b) => safeNum(b.revenue ?? b.popularity) - safeNum(a.revenue ?? a.popularity));
    case 'popularity.desc':
    default:
      return list.sort((a, b) => safeNum(b.popularity) - safeNum(a.popularity));
  }
}

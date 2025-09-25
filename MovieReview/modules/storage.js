/* Local Storage Operations */

/* Watchlist Management */
export function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem('watchlist') || '[]');
  } catch { 
    return []; 
  }
}

export function setWatchlist(arr) {
  localStorage.setItem('watchlist', JSON.stringify(Array.from(new Set(arr))));
}

export function isMovieInWatchlist(movieId) {
  return getWatchlist().includes(movieId);
}

export function addToWatchlist(movieId) {
  const watchlist = getWatchlist();
  if (!watchlist.includes(movieId)) { 
    watchlist.push(movieId); 
    setWatchlist(watchlist); 
  }
}

export function removeFromWatchlist(movieId) {
  setWatchlist(getWatchlist().filter((id) => id !== movieId));
}

export function toggleWatchlist(movieId) {
  if (isMovieInWatchlist(movieId)) {
    removeFromWatchlist(movieId);
    return false;
  } else {
    addToWatchlist(movieId);
    return true;
  }
}

/* Review Management */
function getReviewKey(movieId) { 
  return `review_${movieId}`; 
}

export function saveReview(movieId, reviewData) {
  localStorage.setItem(getReviewKey(movieId), JSON.stringify(reviewData));
}

export function getReview(movieId) {
  try { 
    return JSON.parse(localStorage.getItem(getReviewKey(movieId)) || 'null'); 
  } catch { 
    return null; 
  }
}

export function deleteReview(movieId) {
  localStorage.removeItem(getReviewKey(movieId));
}

/* Theme Management */
export function saveTheme(theme) { 
  localStorage.setItem('theme', theme); 
}

export function getTheme() { 
  return localStorage.getItem('theme') || 'dark'; 
}

export function toggleTheme() {
  const currentTheme = getTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  saveTheme(newTheme);
  return newTheme;
}


/* Main Application Controller */
import { getPopularMovies, searchMovies, discoverMovies, getGenres, getCompleteMovieDetails, applyClientSort } from './modules/api.js';
import { displayMovies, updatePagination, renderGenres, openModal, closeModal, showLoader, hideLoader, setStatus, applyTheme, toggleFiltersDrawer, closeDrawer, clearFilters, getSearchQuery, getSortValue, setSortValue, getElements, initializeElements } from './modules/ui.js';
import { toggleWatchlist, saveReview, deleteReview, getTheme, toggleTheme } from './modules/storage.js';
import { APP_CONFIG } from './modules/config.js';

/* Application State */
let currentPage = 1;
let totalPages = 1;
let currentQuery = '';
let currentGenres = new Set();
let currentSort = APP_CONFIG.DEFAULT_SORT;

/* Debounce Utility */
function debounce(fn, wait = APP_CONFIG.DEBOUNCE_DELAY) {
  let timeout = null;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

/* Data Loading Functions */
async function loadPopularMovies() {
  setStatus('Loading popular movies…');
  showLoader();
  try {
    const result = await getPopularMovies(currentPage);
    if (!result) return; // aborted
    totalPages = result.totalPages;
    displayMovies(result.movies, handleMovieClick, handleWatchlistToggle);
    updatePagination(currentPage, totalPages);
    setStatus('');
  } catch (error) {
    setStatus('Failed to load movies.', 'error');
  } finally {
    hideLoader();
  }
}

async function loadSearchResults() {
  if (!currentQuery) return loadPopularMovies();
  setStatus(`Searching for "${currentQuery}"…`);
  showLoader();
  try {
    const result = await searchMovies(currentQuery, currentPage);
    if (!result) return;
    totalPages = result.totalPages;
    const sortedMovies = applyClientSort(result.movies, currentSort);
    displayMovies(sortedMovies, handleMovieClick, handleWatchlistToggle);
    updatePagination(currentPage, totalPages);
    setStatus(result.totalResults ? '' : 'No results.');
  } catch (error) {
    setStatus('Search failed.', 'error');
  } finally {
    hideLoader();
  }
}

async function loadFilteredMovies() {
  setStatus('Applying filters…');
  showLoader();
  try {
    const result = await discoverMovies(currentPage, currentSort, currentGenres);
    if (!result) return;
    totalPages = result.totalPages;
    displayMovies(result.movies, handleMovieClick, handleWatchlistToggle);
    updatePagination(currentPage, totalPages);
    setStatus('');
  } catch (error) {
    setStatus('Failed to apply filters.', 'error');
  } finally {
    hideLoader();
  }
}

/* Data Loading Orchestration */
function routeLoad() {
  if (currentQuery) return loadSearchResults();
  if (currentGenres.size > 0 || currentSort !== APP_CONFIG.DEFAULT_SORT) return loadFilteredMovies();
  return loadPopularMovies();
}

/* Event Handlers */
async function handleMovieClick(movieId) {
  showLoader();
  try {
    const movieData = await getCompleteMovieDetails(movieId);
    if (!movieData?.details) return;
    openModal(movieData, handleSimilarMovieClick, handleReviewSave, handleReviewDelete);
  } catch (error) {
    setStatus('Failed to load movie details.', 'error');
  } finally {
    hideLoader();
  }
}

function handleSimilarMovieClick(movieId) {
  closeModal();
  handleMovieClick(movieId);
}

function handleWatchlistToggle(movieId) {
  return toggleWatchlist(movieId);
}

function handleReviewSave(movieId, reviewData) {
  saveReview(movieId, reviewData);
  setStatus('Review saved.');
}

function handleReviewDelete(movieId) {
  deleteReview(movieId);
  setStatus('Review removed.');
}

function handleSearch() {
  currentQuery = getSearchQuery();
  currentPage = 1;
  routeLoad();
}

function handleSortChange() {
  currentSort = getSortValue();
  currentPage = 1;
  routeLoad();
}

function handleGenreClick(genreId, buttonElement) {
  const active = currentGenres.has(String(genreId));
  if (active) {
    currentGenres.delete(String(genreId));
  } else {
    currentGenres.add(String(genreId));
  }
  buttonElement.setAttribute('aria-pressed', (!active).toString());
  currentPage = 1;
  routeLoad();
}

function handlePagination(direction) {
  if (direction === 'prev' && currentPage > 1) {
    currentPage--;
  } else if (direction === 'next' && currentPage < totalPages) {
    currentPage++;
  } else {
    return;
  }
  routeLoad();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleClearFilters() {
  currentGenres.clear();
  currentSort = APP_CONFIG.DEFAULT_SORT;
  currentQuery = '';
  currentPage = 1;
  
  clearFilters();
  routeLoad();
}

function handleThemeToggle() {
  const newTheme = toggleTheme();
  applyTheme(newTheme);
}

function handleMenuToggle() {
  const expanded = getElements().menuButton.getAttribute('aria-expanded') === 'true';
  const next = !expanded;
  getElements().menuButton.setAttribute('aria-expanded', next.toString());
  toggleFiltersDrawer(next);
}

function handleHomeClick() {
  currentGenres.clear();
  currentSort = APP_CONFIG.DEFAULT_SORT;
  currentQuery = '';
  currentPage = 1;
  
  clearFilters();
  closeDrawer();
  loadPopularMovies();
}

/* Event Listeners Setup */
function attachEventListeners() {
  const elements = getElements();
  
  // Pagination
  elements.prev.addEventListener('click', () => handlePagination('prev'));
  elements.next.addEventListener('click', () => handlePagination('next'));
  
  // Search and Sort
  elements.search.addEventListener('input', debounce(handleSearch));
  elements.sort.addEventListener('change', handleSortChange);
  
  // Filters
  elements.clearFilters.addEventListener('click', handleClearFilters);
  
  // Theme
  elements.themeToggle.addEventListener('click', handleThemeToggle);
  
  // Menu/Drawer
  elements.menuButton?.addEventListener('click', handleMenuToggle);
  elements.drawerBackdrop?.addEventListener('click', closeDrawer);
  
  // Home button
  const title = document.querySelector('.title');
  title?.addEventListener('click', handleHomeClick);
  
  // Modal
  elements.modal.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close') || e.target.closest('[data-close]')) {
      closeModal();
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!elements.modal.classList.contains('hidden')) closeModal();
      else closeDrawer();
    }
  });
}

/* Initialization */
async function initializeApp() {
  try {
    // Initialize UI elements
    initializeElements();
    
    // Apply saved theme
    applyTheme(getTheme());
    
    // Attach event listeners
    attachEventListeners();
    
    // Load genres
    const genres = await getGenres();
    renderGenres(genres, handleGenreClick);
    
    // Initialize filters state
    getElements().menuButton?.setAttribute('aria-expanded', 'false');
    const filters = document.getElementById('filters-container');
    if (window.matchMedia('(max-width: 700px)').matches) {
      filters.classList.remove('open');
      getElements().drawerBackdrop?.classList.add('hidden');
    } else {
      filters.classList.add('collapsed');
    }
    
    // Load initial data
    await loadPopularMovies();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    setStatus('Something went wrong. Please try again later.', 'error');
  }
}

/* Start the application */
initializeApp();


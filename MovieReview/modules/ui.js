/* UI Manipulation and Display Logic */
import { IMG_W185, IMG_W342 } from './config.js';
import { isMovieInWatchlist, getReview } from './storage.js';

/* Utility Functions */
const formatDate = (str) => (str ? new Date(str).toLocaleDateString() : '—');
const percent = (v) => (v ? Math.round(v * 10) + '%' : '—');
const posterUrl = (path, size = IMG_W342) => (path ? `${size}${path}` : '');

/* DOM Element References */
let elements = {};

export function initializeElements() {
  elements = {
    grid: document.getElementById('movies-grid'),
    status: document.getElementById('status-container'),
    prev: document.getElementById('prev-page'),
    next: document.getElementById('next-page'),
    page: document.getElementById('page-indicator'),
    search: document.getElementById('search-input'),
    sort: document.getElementById('sort-select'),
    modal: document.getElementById('modal-container'),
    modalBody: document.getElementById('modal-body'),
    loader: document.getElementById('loader-container'),
    genresChipset: document.getElementById('genres-chipset'),
    clearFilters: document.getElementById('clear-filters'),
    themeToggle: document.getElementById('theme-toggle'),
    main: document.getElementById('main-content'),
    menuButton: document.getElementById('menu-button'),
    cardTpl: document.getElementById('movie-card-template'),
    drawerBackdrop: document.getElementById('drawer-backdrop'),
  };
}

/* Loading and Status */
export function showLoader() {
  elements.loader.classList.remove('hidden');
}

export function hideLoader() {
  elements.loader.classList.add('hidden');
}

export function setStatus(msg, type = 'info') {
  elements.status.textContent = msg || '';
  elements.status.dataset.type = type;
}

/* Movie Card Creation */
function createMovieCard(movie, onCardClick, onWatchlistToggle) {
  const node = elements.cardTpl.content.firstElementChild.cloneNode(true);
  const posterImg = node.querySelector('.poster');
  const title = node.querySelector('.movie-title');
  const meta = node.querySelector('.meta');
  const rating = node.querySelector('.rating-badge');
  const watchBtn = node.querySelector('.watchlist-button');

  const poster = posterUrl(movie.poster_path, IMG_W342);
  posterImg.src = poster || '';
  posterImg.alt = movie.title || movie.name || 'Poster';
  title.textContent = movie.title || movie.name || 'Untitled';
  meta.textContent = `${formatDate(movie.release_date)} • ★ ${movie.vote_average?.toFixed(1) ?? '—'}`;
  rating.textContent = percent(movie.vote_average);

  if (isMovieInWatchlist(movie.id)) watchBtn.classList.add('active');
  watchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = onWatchlistToggle(movie.id);
    watchBtn.classList.toggle('active', isActive);
  });

  node.addEventListener('click', () => onCardClick(movie.id));
  return node;
}

/* Movie Grid Display */
export function displayMovies(movies, onCardClick, onWatchlistToggle) {
  elements.grid.innerHTML = '';
  if (!movies || movies.length === 0) {
    elements.grid.innerHTML = '<p style="grid-column:1/-1;color:var(--text-dim)">No movies found.</p>';
    return;
  }
  const frag = document.createDocumentFragment();
  for (const movie of movies) frag.appendChild(createMovieCard(movie, onCardClick, onWatchlistToggle));
  elements.grid.appendChild(frag);
}

/* Pagination */
export function updatePagination(currentPage, totalPages) {
  elements.page.textContent = `Page ${currentPage} of ${totalPages}`;
  elements.prev.disabled = currentPage <= 1;
  elements.next.disabled = currentPage >= totalPages;
}

/* Genres */
export function renderGenres(genres, onGenreClick) {
  elements.genresChipset.innerHTML = '';
  const frag = document.createDocumentFragment();
  genres.forEach((genre) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = genre.name;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => onGenreClick(genre.id, btn));
    frag.appendChild(btn);
  });
  elements.genresChipset.appendChild(frag);
}

export function updateGenreButtons(selectedGenres) {
  elements.genresChipset.querySelectorAll('.chip').forEach((btn) => {
    const genreName = btn.textContent;
    // This is a simplified approach - you might want to store genre IDs in data attributes
    btn.setAttribute('aria-pressed', 'false');
  });
}

/* Modal */
export function openModal(movieData, onSimilarClick, onReviewSave, onReviewDelete) {
  const { details, videos, credits, similar } = movieData;
  const trailer = (videos || []).find((v) => v.site === 'YouTube' && v.type === 'Trailer');
  const genres = (details.genres || []).map((g) => `<span class="pill">${g.name}</span>`).join('');
  
  const cast = (credits?.cast || []).slice(0, 12).map((c) => `
    <div class="cast-card">
      <img src="${posterUrl(c.profile_path, IMG_W185) || ''}" alt="${c.name}" />
      <div class="name">${c.name}</div>
      <div class="role">${c.character || ''}</div>
    </div>
  `).join('');
  
  const crew = (credits?.crew || []).slice(0, 10).map((p) => `
    <div class="cast-card">
      <img src="${posterUrl(p.profile_path, IMG_W185) || ''}" alt="${p.name}" />
      <div class="name">${p.name}</div>
      <div class="role">${p.job || ''}</div>
    </div>
  `).join('');
  
  const similarGrid = (similar || []).slice(0, 12).map((m) => `
    <div class="similar-card" data-id="${m.id}">
      <img src="${posterUrl(m.poster_path, IMG_W342) || ''}" alt="${m.title}" />
      <div class="title">${m.title}</div>
    </div>
  `).join('');

  const review = getReview(details.id);
  const starsHtml = Array.from({ length: 5 }).map((_, i) => `
    <button class="star" data-star="${i+1}" aria-label="Rate ${i+1} stars">
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2L12 17.4l-6 4.8 2.4-7.2-6-4.8h7.6L12 2z" fill="currentColor" stroke="none"/></svg>
    </button>
  `).join('');

  elements.modalBody.innerHTML = `
    <div class="modal-hero">
      <img class="poster" src="${posterUrl(details.poster_path, IMG_W342)}" alt="${details.title}" />
      <div>
        <h2 id="modal-title" class="modal-title">${details.title}</h2>
        <p class="modal-sub">${formatDate(details.release_date)} • ${details.runtime || '—'} min • ★ ${details.vote_average?.toFixed(1) ?? '—'}</p>
        ${details.tagline ? `<p class="tagline">"${details.tagline}"</p>` : ''}
        <p>${details.overview || ''}</p>
        <div class="section">${genres}</div>
        ${trailer ? `
          <div class="section">
            <h3>Trailer</h3>
            <iframe width="100%" height="320" src="https://www.youtube.com/embed/${trailer.key}" title="YouTube trailer" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
          </div>` : ''}
      </div>
    </div>
    <div class="section">
      <h3>Cast</h3>
      <div class="cast-grid">${cast}</div>
    </div>
    <div class="section">
      <h3>Crew</h3>
      <div class="cast-grid">${crew}</div>
    </div>
    <div class="section review-section" data-movie-id="${details.id}">
      <h3>Your Review</h3>
      <div class="stars" role="radiogroup" aria-label="Your rating">
        ${starsHtml}
      </div>
      <textarea class="review-text" placeholder="Share your thoughts…">${review?.text || ''}</textarea>
      <div class="review-actions">
        <button class="button" data-action="save-review">Save</button>
        <button class="text-button" data-action="delete-review">Delete</button>
      </div>
    </div>
    <div class="section">
      <h3>Similar Movies</h3>
      <div class="similar-grid">${similarGrid}</div>
    </div>
  `;

  // Stars interactions
  setupStarRating(details.id, review?.rating || 0, onReviewSave);
  
  // Similar movies click handlers
  elements.modalBody.querySelectorAll('.similar-card').forEach((card) => {
    card.addEventListener('click', () => onSimilarClick(Number(card.dataset.id)));
  });

  // Review action handlers
  const reviewSection = elements.modalBody.querySelector('.review-section');
  elements.modalBody.querySelector('[data-action="save-review"]').addEventListener('click', () => {
    const text = reviewSection.querySelector('.review-text').value.trim();
    const rating = getCurrentStarRating();
    onReviewSave(details.id, { rating, text });
  });
  
  elements.modalBody.querySelector('[data-action="delete-review"]').addEventListener('click', () => {
    onReviewDelete(details.id);
  });

  elements.modal.classList.remove('hidden');
}

export function closeModal() {
  elements.modal.classList.add('hidden');
  elements.modalBody.innerHTML = '';
}

/* Star Rating Setup */
let currentStarRating = 0;

function setupStarRating(movieId, initialRating, onSave) {
  currentStarRating = initialRating;
  
  function renderStars() {
    elements.modalBody.querySelectorAll('.star').forEach((s, idx) => {
      if (idx < currentStarRating) {
        s.classList.add('filled');
      } else {
        s.classList.remove('filled');
      }
    });
  }
  
  // Initialize stars display
  setTimeout(() => {
    renderStars();
    
    // Attach star click handlers
    elements.modalBody.querySelectorAll('.star').forEach((btn, idx) => {
      btn.addEventListener('click', (e) => { 
        e.preventDefault();
        e.stopPropagation();
        currentStarRating = idx + 1;
        renderStars(); 
      });
    });
  }, 50);
}

export function getCurrentStarRating() {
  return currentStarRating;
}

/* Theme */
export function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
}

/* Filters Drawer */
export function toggleFiltersDrawer(isOpen) {
  const filters = document.getElementById('filters-container');
  if (window.matchMedia('(max-width: 700px)').matches) {
    // Off-canvas behavior
    filters.classList.toggle('open', isOpen);
    elements.drawerBackdrop?.classList.toggle('hidden', !isOpen);
    if (isOpen) filters.focus?.();
  } else {
    // Desktop: no drawer
    filters.classList.toggle('collapsed', !isOpen);
    if (isOpen) filters.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

export function closeDrawer() {
  const filters = document.getElementById('filters-container');
  if (window.matchMedia('(max-width: 700px)').matches) {
    filters.classList.remove('open');
    elements.drawerBackdrop?.classList.add('hidden');
    elements.menuButton?.setAttribute('aria-expanded', 'false');
  }
}

/* Form Controls */
export function clearFilters() {
  elements.search.value = '';
  elements.sort.value = 'popularity.desc';
  elements.genresChipset.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
}

export function getSearchQuery() {
  return elements.search.value.trim();
}

export function getSortValue() {
  return elements.sort.value;
}

export function setSortValue(value) {
  elements.sort.value = value;
}

export function getElements() {
  return elements;
}

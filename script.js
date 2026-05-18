/* ============================================================
   Isaiah's Corner — script.js
   Page-scoped. No global managers running on every page.
   ============================================================ */

'use strict';

/* ── Shared utilities ─────────────────────────────────────── */

function setYear() {
  document.querySelectorAll('.js-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Active nav link ──────────────────────────────────────── */

function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav__link, .nav-overlay__link').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (!href) return;

    const isHome     = (path === '/' || path === '/index.html');
    const linkIsHome = (href === '/' || href === '/index.html');

    if (isHome && linkIsHome) {
      link.classList.add('active');
    } else if (!isHome && href !== '/' && path.includes(href.replace(/^\//, ''))) {
      link.classList.add('active');
    }
  });
}

/* ── Mobile nav ───────────────────────────────────────────── */

function initMobileNav() {
  const toggle  = document.getElementById('navToggle');
  const overlay = document.getElementById('navOverlay');
  const close   = document.getElementById('navClose');
  if (!toggle || !overlay || !close) return;

  let lastFocus = null;

  function openNav() {
    lastFocus = document.activeElement;
    overlay.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    close.focus();
  }

  function closeNav() {
    overlay.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  toggle.addEventListener('click', openNav);
  close.addEventListener('click', closeNav);

  overlay.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeNav();
  });

  overlay.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusable = overlay.querySelectorAll(
      'button, a[href], input, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

/* ── Header scroll backdrop ───────────────────────────────── */

function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;

  function update() {
    header.classList.toggle('header--scrolled', window.scrollY > 40);
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ── Reading progress bar ─────────────────────────────────── */

function initReadingProgress() {
  const bar = document.getElementById('readingProgress');
  if (!bar) return;

  function update() {
    const scrollTop  = window.scrollY;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width  = Math.min(pct, 100) + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ── Search toggle ────────────────────────────────────────── */

function initSearchToggle() {
  const toggleBtn  = document.getElementById('searchToggle');
  const searchWrap = document.getElementById('searchWrap');
  const searchInput = document.getElementById('searchInput');
  if (!toggleBtn || !searchWrap) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = searchWrap.classList.contains('search-wrap--open');
    searchWrap.classList.toggle('search-wrap--open', !isOpen);
    toggleBtn.classList.toggle('active', !isOpen);
    toggleBtn.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen && searchInput) searchInput.focus();
  });
}

/* ── Fetch helper ─────────────────────────────────────────── */

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

function basePath() {
  return window.location.pathname.includes('/blog/') ? '../' : '';
}

/* ── Post card HTML ───────────────────────────────────────── */

function postCardHTML(post, linkPrefix = '/blog/') {
  return `
    <article class="post-card">
      <a class="post-card__link" href="${linkPrefix}${escapeHtml(post.slug)}.html">
        <div class="post-card__image">
          <img src="${escapeHtml(post.image)}" alt="" loading="lazy">
        </div>
        <div class="post-card__body">
          <p class="post-card__date">${escapeHtml(post.date)}</p>
          <h2 class="post-card__title">${escapeHtml(post.title)}</h2>
          <p class="post-card__excerpt">${escapeHtml(post.excerpt)}</p>
          <div class="post-card__footer">
            <span class="post-card__read-more">read more →</span>
          </div>
        </div>
      </a>
    </article>
  `;
}

/* ── Featured card HTML ───────────────────────────────────── */

function featuredCardHTML(post, linkPrefix = '/blog/') {
  return `
    <a class="featured-card" href="${linkPrefix}${escapeHtml(post.slug)}.html">
      <div class="featured-card__image">
        <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy">
      </div>
      <div class="featured-card__body">
        <p class="featured-card__label">latest</p>
        <p class="featured-card__date">${escapeHtml(post.date)}</p>
        <h2 class="featured-card__title">${escapeHtml(post.title)}</h2>
        <p class="featured-card__excerpt">${escapeHtml(post.excerpt)}</p>
        <span class="featured-card__cta">read more →</span>
      </div>
    </a>
  `;
}

/* ============================================================
   HOME PAGE — featured latest + 2-col recent
   ============================================================ */

async function initHome() {
  const container = document.getElementById('recentPosts');
  if (!container) return;

  try {
    const posts = await fetchJSON(`${basePath()}posts.json`);
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    const [featured, ...rest] = posts.slice(0, 3);

    let html = '';

    if (featured) {
      html += featuredCardHTML(featured);
    }

    if (rest.length > 0) {
      html += `<div class="posts-grid posts-grid--two">`;
      html += rest.map(p => postCardHTML(p)).join('');
      html += `</div>`;
    }

    container.innerHTML = html;
  } catch (err) {
    console.error('Could not load recent posts:', err);
  }
}

/* ============================================================
   BLOG INDEX — featured on page 1 + paginated grid + search
   ============================================================ */

async function initBlog() {
  const grid        = document.getElementById('blogPosts');
  const pagination  = document.getElementById('pagination');
  const searchInput = document.getElementById('searchInput');
  const searchEmpty = document.getElementById('searchEmpty');
  if (!grid) return;

  const PER_PAGE = 9;
  let allPosts   = [];
  let filtered   = [];
  let page       = 1;

  function isSearching() {
    return searchInput && searchInput.value.trim() !== '';
  }

  function renderGrid(posts) {
    if (posts.length === 0) {
      grid.innerHTML = '';
      if (searchEmpty) searchEmpty.style.display = 'block';
      if (pagination)  pagination.innerHTML = '';
      return;
    }
    if (searchEmpty) searchEmpty.style.display = 'none';

    const start = (page - 1) * PER_PAGE;
    const slice = posts.slice(start, start + PER_PAGE);

    // Feature the first post on page 1 when not searching
    if (page === 1 && !isSearching() && slice.length > 0) {
      const [featured, ...rest] = slice;
      grid.innerHTML = featuredCardHTML(featured) + rest.map(p => postCardHTML(p)).join('');
    } else {
      grid.innerHTML = slice.map(p => postCardHTML(p)).join('');
    }

    renderPagination(posts.length);
  }

  function renderPagination(total) {
    if (!pagination) return;
    const totalPages = Math.ceil(total / PER_PAGE);
    if (totalPages <= 1) { pagination.innerHTML = ''; return; }

    let html = `
      <button class="pagination__btn" id="prevBtn" ${page === 1 ? 'disabled' : ''} aria-label="Previous page">
        ← prev
      </button>
    `;
    for (let i = 1; i <= totalPages; i++) {
      html += `
        <button class="pagination__number ${i === page ? 'active' : ''}" data-page="${i}" aria-label="Page ${i}" aria-current="${i === page ? 'page' : 'false'}">
          ${i}
        </button>
      `;
    }
    html += `
      <button class="pagination__btn" id="nextBtn" ${page === totalPages ? 'disabled' : ''} aria-label="Next page">
        next →
      </button>
    `;
    pagination.innerHTML = html;

    pagination.querySelector('#prevBtn').addEventListener('click', () => {
      if (page > 1) { page--; renderGrid(filtered); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });
    pagination.querySelector('#nextBtn').addEventListener('click', () => {
      if (page < totalPages) { page++; renderGrid(filtered); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });
    pagination.querySelectorAll('.pagination__number').forEach(btn => {
      btn.addEventListener('click', () => {
        page = parseInt(btn.dataset.page, 10);
        renderGrid(filtered);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      page = 1;
      filtered = q
        ? allPosts.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.excerpt.toLowerCase().includes(q)
          )
        : allPosts;
      renderGrid(filtered);
    });
  }

  try {
    allPosts = await fetchJSON(`${basePath()}posts.json`);
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    filtered = allPosts;
    renderGrid(filtered);
  } catch (err) {
    console.error('Could not load blog posts:', err);
    grid.innerHTML = '<p style="color: var(--text-muted); font-style: italic; padding: 40px 0;">posts could not be loaded.</p>';
  }
}

/* ============================================================
   BLOG POST — prev/next navigation
   ============================================================ */

async function initPost() {
  const navEl = document.getElementById('postNav');
  if (!navEl) return;

  const slug = window.location.pathname.split('/').pop().replace('.html', '');

  try {
    const posts = await fetchJSON(`${basePath()}posts.json`);
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    const idx  = posts.findIndex(p => p.slug === slug);
    if (idx === -1) return;

    const prev = posts[idx + 1]; // older
    const next = posts[idx - 1]; // newer

    navEl.innerHTML = `
      ${prev ? `
        <a class="post-nav__item post-nav__item--prev" href="${escapeHtml(prev.slug)}.html">
          <span class="post-nav__label">← previous</span>
          <span class="post-nav__title">${escapeHtml(prev.title)}</span>
        </a>
      ` : '<span></span>'}
      ${next ? `
        <a class="post-nav__item post-nav__item--next" href="${escapeHtml(next.slug)}.html">
          <span class="post-nav__label">next →</span>
          <span class="post-nav__title">${escapeHtml(next.title)}</span>
        </a>
      ` : '<span></span>'}
    `;
  } catch (err) {
    console.error('Could not load post navigation:', err);
  }
}

/* ============================================================
   ART & POETRY PAGE
   ============================================================ */

async function initArt() {
  const grid = document.getElementById('artGrid');
  if (!grid) return;

  try {
    const items = await fetchJSON(`${basePath()}art.json`);

    grid.innerHTML = items.map(item => {
      if (item.type === 'poem') {
        const previewLines = item.content.split('\n').slice(0, 4).join('\n');
        return `
          <div class="art-item art-item--poem-card" role="button" tabindex="0" aria-label="Read poem: ${escapeHtml(item.title)}" data-item='${JSON.stringify(item).replace(/'/g, "&#x27;")}'>
            <div class="art-item__poem">
              <h2 class="art-item__poem-title">${escapeHtml(item.title)}</h2>
              <div class="art-item__poem-preview">${escapeHtml(previewLines)}</div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="art-item" role="button" tabindex="0" aria-label="View artwork: ${escapeHtml(item.title)}" data-item='${JSON.stringify(item).replace(/'/g, "&#x27;")}'>
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">
          </div>
        `;
      }
    }).join('');

    grid.addEventListener('click', e => {
      const card = e.target.closest('.art-item');
      if (card) openModal(JSON.parse(card.dataset.item));
    });

    grid.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.art-item');
        if (card) { e.preventDefault(); openModal(JSON.parse(card.dataset.item)); }
      }
    });

  } catch (err) {
    console.error('Could not load art items:', err);
  }
}

/* ── Art modal ────────────────────────────────────────────── */

function openModal(item) {
  const existing = document.querySelector('.art-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className  = 'art-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'modalTitle');

  let body = '';
  if (item.type === 'poem') {
    body = `
      <h2 class="art-modal__title" id="modalTitle">${escapeHtml(item.title)}</h2>
      <div class="art-modal__poem-text">${escapeHtml(item.content)}</div>
    `;
  } else {
    body = `
      <h2 class="art-modal__title" id="modalTitle">${escapeHtml(item.title)}</h2>
      ${item.date ? `<p class="art-modal__date">${escapeHtml(item.date)}</p>` : ''}
      <img class="art-modal__image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
    `;
  }

  modal.innerHTML = `
    <div class="art-modal__content">
      <button class="art-modal__close" aria-label="Close">&times;</button>
      <div class="art-modal__body">${body}</div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  const closeBtn = modal.querySelector('.art-modal__close');
  closeBtn.focus();

  function closeModal() {
    modal.remove();
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  modal.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') {
      const focusable = modal.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });
}

/* ============================================================
   INIT — route to the right initializer
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  setYear();
  setActiveNav();
  initMobileNav();
  initHeaderScroll();

  const path = window.location.pathname;

  if (path === '/' || path.endsWith('index.html')) {
    initHome();
  } else if (path.endsWith('blog.html')) {
    initBlog();
    initSearchToggle();
  } else if (path.endsWith('art.html')) {
    initArt();
  } else if (path.includes('/blog/')) {
    initPost();
    initReadingProgress();
  }
});

let LIGHTBOX_STATE = { source: null, index: 0 };

function getSourceArray(name) {
  if (name === 'ARTWORKS') return ARTWORKS;
  if (name === 'ARTWORKS_ALL') return ARTWORKS_ALL;
  if (name === 'GRABADOS') return GRABADOS;
  if (name === 'EXHIBITIONS') return EXHIBITIONS;
  return [];
}

function renderGalleries(lang) {
  document.querySelectorAll('[data-gallery]').forEach((container) => {
    renderOneGallery(container, lang);
  });
}

function renderOneGallery(container, lang) {
  const sourceName = container.getAttribute('data-gallery');
  const items = getSourceArray(sourceName);
  const pageSize = parseInt(container.getAttribute('data-paginate'), 10) || 0;

  let pageItems = items;
  let startIndex = 0;

  if (pageSize > 0) {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    let page = parseInt(container.dataset.page, 10) || 1;
    page = Math.min(Math.max(page, 1), totalPages);
    container.dataset.page = String(page);
    startIndex = (page - 1) * pageSize;
    pageItems = items.slice(startIndex, startIndex + pageSize);
  }

  container.innerHTML = pageItems
    .map((work, i) => {
      const globalIndex = startIndex + i;
      return `
        <div class="gallery-item" data-source="${sourceName}" data-index="${globalIndex}">
          <img src="${work.image}" alt="${work.name[lang] || work.name.es}" loading="lazy" />
        </div>`;
    })
    .join('');

  container.querySelectorAll('.gallery-item').forEach((el) => {
    el.addEventListener('click', () => {
      openLightbox(el.getAttribute('data-source'), parseInt(el.getAttribute('data-index'), 10));
    });
  });

  if (pageSize > 0) {
    renderPaginationFor(container, items.length, pageSize);
  }
}

function renderPaginationFor(container, totalItems, pageSize) {
  const nav = container.id ? document.querySelector(`[data-pagination-for="${container.id}"]`) : null;
  if (!nav) return;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(parseInt(container.dataset.page, 10) || 1, 1), totalPages);

  const chevron = (d) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;

  const numberButtons = [];
  for (let p = 1; p <= totalPages; p++) {
    numberButtons.push(
      `<button type="button" class="page-num${p === page ? ' active' : ''}" data-page="${p}">${p}</button>`
    );
  }

  nav.innerHTML = `
    <button type="button" class="page-arrow page-prev" aria-label="Anterior"${page <= 1 ? ' disabled' : ''}>
      ${chevron('M15 5 L8 12 L15 19')}
    </button>
    ${numberButtons.join('')}
    <button type="button" class="page-arrow page-next" aria-label="Siguiente"${page >= totalPages ? ' disabled' : ''}>
      ${chevron('M9 5 L16 12 L9 19')}
    </button>
  `;

  const goTo = (p) => {
    container.dataset.page = String(p);
    renderOneGallery(container, getLang());
  };

  nav.querySelectorAll('.page-num').forEach((btn) => {
    btn.addEventListener('click', () => goTo(parseInt(btn.getAttribute('data-page'), 10)));
  });
  const prevBtn = nav.querySelector('.page-prev');
  const nextBtn = nav.querySelector('.page-next');
  if (prevBtn) prevBtn.addEventListener('click', () => goTo(page - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(page + 1));
}

function openLightbox(source, index) {
  LIGHTBOX_STATE = { source, index };
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
  updateLightbox();
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

function navigateLightbox(delta) {
  const items = getSourceArray(LIGHTBOX_STATE.source);
  if (!items.length) return;
  LIGHTBOX_STATE.index = (LIGHTBOX_STATE.index + delta + items.length) % items.length;
  updateLightbox();
}

function updateLightbox() {
  const items = getSourceArray(LIGHTBOX_STATE.source);
  const work = items[LIGHTBOX_STATE.index];
  if (!work) return;
  const lang = getLang();

  const img = document.getElementById('lightbox-img');
  const nameEl = document.getElementById('lightbox-name');
  const techEl = document.getElementById('lightbox-technique');
  const measEl = document.getElementById('lightbox-measures');
  const soldEl = document.getElementById('lightbox-sold');
  const nav = document.getElementById('lightbox-nav');

  if (img) {
    img.src = work.image;
    img.alt = work.name[lang] || work.name.es;
  }
  if (nameEl) nameEl.textContent = work.name[lang] || work.name.es;
  if (techEl) {
    const tech = work.technique[lang] || work.technique.es;
    techEl.textContent = tech;
    techEl.style.display = tech ? 'block' : 'none';
  }
  if (measEl) {
    measEl.textContent = work.measures;
    measEl.style.display = work.measures ? 'block' : 'none';
  }
  if (soldEl) {
    const dict = I18N[lang] || I18N.es;
    soldEl.textContent = lang === 'en' ? 'Sold' : 'VENDIDO';
    soldEl.style.display = work.sold ? 'block' : 'none';
  }
  if (nav) {
    nav.style.display = items.length > 1 ? 'flex' : 'none';
  }
}

function refreshLightboxText(lang) {
  const lightbox = document.getElementById('lightbox');
  if (lightbox && lightbox.classList.contains('active')) {
    updateLightbox();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  const lightbox = document.getElementById('lightbox');

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (prevBtn) prevBtn.addEventListener('click', () => navigateLightbox(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigateLightbox(1));
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });
});

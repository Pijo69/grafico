let LIGHTBOX_STATE = { source: null, index: 0 };

function getSourceArray(name) {
  if (name === 'ARTWORKS') return ARTWORKS;
  if (name === 'GRABADOS') return GRABADOS;
  return [];
}

function renderGalleries(lang) {
  document.querySelectorAll('[data-gallery]').forEach((container) => {
    const sourceName = container.getAttribute('data-gallery');
    const items = getSourceArray(sourceName);

    container.innerHTML = items
      .map(
        (work, i) => `
        <div class="gallery-item" data-source="${sourceName}" data-index="${i}">
          <img src="${work.image}" alt="${work.name[lang] || work.name.es}" loading="lazy" />
        </div>`
      )
      .join('');

    container.querySelectorAll('.gallery-item').forEach((el) => {
      el.addEventListener('click', () => {
        openLightbox(el.getAttribute('data-source'), parseInt(el.getAttribute('data-index'), 10));
      });
    });
  });
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
  if (techEl) techEl.textContent = work.technique[lang] || work.technique.es;
  if (measEl) measEl.textContent = work.measures;
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

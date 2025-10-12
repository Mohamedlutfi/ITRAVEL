// Gallery client: fetch all trips and render cards with lightbox
document.addEventListener('DOMContentLoaded', function () {
  const grid = document.getElementById('gallery-grid');
  const lightbox = document.getElementById('gallery-lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbTitle = document.getElementById('lb-title');
  const lbDesc = document.getElementById('lb-desc');
  const lbUser = document.getElementById('lb-user');
  const lbClose = lightbox ? lightbox.querySelector('.lb-close') : null;

  async function loadAll() {
    try {
      const res = await fetch('/trips/all');
      const data = await res.json();
      render(data.trips || []);
    } catch (err) {
      console.error('Failed to load gallery', err);
      if (grid) grid.innerHTML = '<p class="error">Failed to load gallery.</p>';
    }
  }

  function render(trips) {
    if (!grid) return;
    grid.innerHTML = '';
    trips.forEach(t => {
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.innerHTML = `
        <div class="gallery-imgwrap">
          <img src="${t.img || '/img/pick.jpg'}" alt="${escapeHtml(t.title)}" data-id="${t.id}" data-title="${escapeHtml(t.title)}" data-desc="${escapeHtml(t.description)}" data-user="${escapeHtml(t.username || '')}" class="gallery-img" />
        </div>
        <div class="gallery-info">
          <h3>${escapeHtml(t.title)}</h3>
          <p>${escapeHtml(t.description)}</p>
          <small>by ${escapeHtml(t.username || 'unknown')}</small>
        </div>
      `;
      grid.appendChild(card);
    });

    // attach click handler for lightbox
    grid.querySelectorAll('.gallery-img').forEach(img => img.addEventListener('click', onOpen));
  }

  function escapeHtml(s) { return (s || '').replace(/[&<>'"]/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" }[c]; }); }

  function onOpen(e) {
    const img = e.currentTarget;
    const src = img.getAttribute('src');
    const title = img.dataset.title || '';
    const desc = img.dataset.desc || '';
    const user = img.dataset.user || '';
    if (!lightbox) return;
    lbImg.src = src;
    lbTitle.textContent = title;
    lbDesc.textContent = desc;
    lbUser.textContent = user ? 'by ' + user : '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  }

  function onClose() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lbImg.src = '';
  }

  if (lbClose) lbClose.addEventListener('click', onClose);
  if (lightbox) lightbox.querySelector('.lb-backdrop').addEventListener('click', onClose);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') onClose(); });

  loadAll();
});

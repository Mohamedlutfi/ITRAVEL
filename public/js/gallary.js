// Gallery client: fetch paginated trips and render cards with lightbox
document.addEventListener('DOMContentLoaded', function () {
  const grid = document.getElementById('gallery-grid');
  const lightbox = document.getElementById('gallery-lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbTitle = document.getElementById('lb-title');
  const lbDesc = document.getElementById('lb-desc');
  const lbUser = document.getElementById('lb-user');
  const lbClose = lightbox ? lightbox.querySelector('.lb-close') : null;
  
  // Pagination elements
  const paginationContainer = document.getElementById('pagination-container');
  const paginationNumbers = document.getElementById('pagination-numbers');
  const paginationInfo = document.getElementById('pagination-info');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  
  let currentPage = 1;
  let totalPages = 1;

  async function loadPage(page = 1, updateUrl = true) {
    try {
      console.log('Loading gallery page:', page);
      const res = await fetch(`/trips/all?page=${page}&limit=3`);
      const data = await res.json();
      console.log('Gallery data received:', data);
      
      if (data.trips && data.pagination) {
        currentPage = data.pagination.currentPage;
        totalPages = data.pagination.totalPages;
        
        render(data.trips);
        renderPagination(data.pagination);
        
        // Update URL without causing page reload
        if (updateUrl) {
          const newUrl = page === 1 ? window.location.pathname : `${window.location.pathname}?page=${page}`;
          window.history.pushState({ page: page }, '', newUrl);
        }
        
        // Scroll to top of gallery
        document.querySelector('.gallery-header').scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Failed to load gallery', err);
      if (grid) grid.innerHTML = '<p class="error">Failed to load gallery.</p>';
    }
  }

  function render(trips) {
    if (!grid) return;
    grid.innerHTML = '';
    
    if (!trips || trips.length === 0) {
      grid.innerHTML = '<p class="no-trips">No memories found.</p>';
      return;
    }
    
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
          ${t.location_name ? ('<small>Location: ' + escapeHtml(t.location_name) + '</small>') : ''}
          <br/>
          <small>by ${escapeHtml(t.username || 'unknown')}</small>
        </div>
      `;
      grid.appendChild(card);
    });

    // attach click handler for lightbox and error handling for broken images
    grid.querySelectorAll('.gallery-img').forEach(img => {
      img.addEventListener('click', onOpen);
      img.addEventListener('error', function() {
        console.warn('Failed to load image:', this.src);
        this.src = '/img/pick.jpg'; // fallback image
        this.style.border = '2px solid red';
        this.title = 'Image failed to load: ' + this.dataset.title;
      });
    });
  }

  function renderPagination(pagination) {
    if (!paginationContainer || !pagination) return;
    
    // Show pagination container
    paginationContainer.style.display = 'block';
    
    // Update pagination info
    const start = ((pagination.currentPage - 1) * pagination.itemsPerPage) + 1;
    const end = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);
    paginationInfo.textContent = `Showing ${start}-${end} of ${pagination.totalItems} memories`;
    
    // Update previous/next buttons
    prevBtn.disabled = !pagination.hasPrevious;
    nextBtn.disabled = !pagination.hasNext;
    
    // Generate page numbers
    renderPageNumbers(pagination.currentPage, pagination.totalPages);
  }

  function renderPageNumbers(currentPage, totalPages) {
    if (!paginationNumbers) return;
    
    paginationNumbers.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page and ellipsis
    if (startPage > 1) {
      addPageNumber(1);
      if (startPage > 2) {
        addEllipsis();
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      addPageNumber(i, i === currentPage);
    }
    
    // Last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        addEllipsis();
      }
      addPageNumber(totalPages);
    }
  }

  function addPageNumber(pageNum, isActive = false) {
    const pageBtn = document.createElement('button');
    pageBtn.className = 'page-number' + (isActive ? ' active' : '');
    pageBtn.textContent = pageNum;
    pageBtn.addEventListener('click', () => loadPage(pageNum));
    paginationNumbers.appendChild(pageBtn);
  }

  function addEllipsis() {
    const ellipsis = document.createElement('span');
    ellipsis.className = 'page-ellipsis';
    ellipsis.textContent = '...';
    paginationNumbers.appendChild(ellipsis);
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

  // Set up lightbox event listeners
  if (lbClose) lbClose.addEventListener('click', onClose);
  if (lightbox) lightbox.querySelector('.lb-backdrop').addEventListener('click', onClose);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') onClose(); });

  // Set up pagination event listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        loadPage(currentPage - 1);
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        loadPage(currentPage + 1);
      }
    });
  }

  // Handle browser back/forward buttons
  window.addEventListener('popstate', (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get('page')) || 1;
    loadPage(page, false); // Don't update URL when handling popstate
  });

  // Check for page parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const initialPage = parseInt(urlParams.get('page')) || 1;
  
  // Load the initial page
  loadPage(initialPage);
});

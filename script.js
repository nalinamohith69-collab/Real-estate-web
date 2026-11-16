/* ============================================================
   LUXESTATE — CLIENT PORTAL JAVASCRIPT
   Dynamic Properties, Search & Filters, Modal Gallery,
   Mortgage Calculator, Favorites Drawer, & Real-Time Sync
   ============================================================ */

'use strict';

let currentFilter = {
  category: 'all',
  query: '',
  type: '',
  budget: ''
};

// ============================================================
// 1. DOM Ready
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initUserSession();
  initMobileMenu();
  initHeroParticles();
  initHeroBgKenBurns();
  initRevealObserver();
  initCounterObserver();

  // Core Real Estate Modules
  initPropertiesModule();
  initHeroSearch();
  initFavoritesSystem();
  initMortgageCalculator();
  initTourModal();
  initContactForm();
  initNewsletterForm();

  // Carousel & Navigation
  initTestimonials();
  initBackToTop();
  initSmoothScroll();
});

// ============================================================
// 2. USER SESSION & NAVBAR
// ============================================================
function initUserSession() {
  const auth = LuxStore.getAuth();
  const userArea = document.getElementById('nav-user-area');
  const userMobileArea = document.getElementById('mobile-user-area');
  const usernameEl = document.getElementById('nav-username');
  const adminLink = document.getElementById('nav-admin-link');
  const mobileAdminLink = document.getElementById('mobile-admin-link');

  const mobileUsernameEl = document.getElementById('mobile-username');

  if (auth && auth.username) {
    if (usernameEl) usernameEl.textContent = '👤 ' + auth.username;
    if (mobileUsernameEl) mobileUsernameEl.textContent = '👤 ' + auth.username;
    if (auth.role === 'admin') {
      if (adminLink) adminLink.style.display = 'inline-flex';
      if (mobileAdminLink) mobileAdminLink.style.display = 'block';
    }
  }
}

function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const onScroll = () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function luxLogout() {
  LuxStore.logout();
}

// ============================================================
// 3. MOBILE MENU
// ============================================================
function initMobileMenu() {
  const btn = document.getElementById('hamburger-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  const toggle = () => {
    const isOpen = menu.classList.toggle('open');
    btn.classList.toggle('active', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
    menu.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  btn.addEventListener('click', toggle);

  menu.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) toggle();
  });
}

// ============================================================
// 4. HERO PARTICLES & KEN BURNS
// ============================================================
function initHeroParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;

  const COUNT = 25;
  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 3 + 1;
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      --dur: ${Math.random() * 12 + 8}s;
      animation-delay: ${Math.random() * 10}s;
      opacity: ${Math.random() * 0.5 + 0.2};
    `;
    container.appendChild(p);
  }
}

function initHeroBgKenBurns() {
  const bg = document.querySelector('.hero-bg');
  if (!bg) return;
  setTimeout(() => bg.classList.add('loaded'), 100);
}

// ============================================================
// 5. REVEAL & COUNTERS
// ============================================================
function initRevealObserver() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}

function initCounterObserver() {
  const counters = document.querySelectorAll('.counter, .stat-number');
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-target'), 10);
    if (isNaN(target)) return;
    const duration = 2000;
    const start = performance.now();

    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target.toLocaleString();
    };
    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

// ============================================================
// 6. PROPERTIES MODULE (DYNAMIC RENDERING & FILTERING)
// ============================================================
function initPropertiesModule() {
  renderProperties(currentFilter);

  // Category filter tabs
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      currentFilter.category = btn.getAttribute('data-filter') || 'all';
      renderProperties(currentFilter);
    });
  });
}

function renderProperties(filter = {}) {
  const grid = document.getElementById('properties-grid');
  const countEl = document.getElementById('listings-counter');
  if (!grid) return;

  const properties = LuxStore.getProperties(filter);

  if (countEl) {
    if (filter.query || filter.type || filter.budget || filter.category !== 'all') {
      countEl.innerHTML = `Showing <strong>${properties.length}</strong> matching luxury estates <button onclick="resetSearchFilters()" style="background:none;border:none;color:var(--gold);cursor:pointer;text-decoration:underline;margin-left:8px;font-size:.82rem;">(Clear Filters)</button>`;
    } else {
      countEl.innerHTML = `Explore our curated selection of <strong>${properties.length}</strong> premier properties`;
    }
  }

  if (!properties.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;background:rgba(255,255,255,0.02);border:1px dashed rgba(201,168,76,0.3);border-radius:16px;">
        <div style="font-size:3rem;margin-bottom:12px;opacity:0.6;">🏰</div>
        <h3 style="font-family:'Playfair Display',serif;font-size:1.6rem;color:var(--text-1);margin-bottom:8px;">No Properties Match Your Selection</h3>
        <p style="color:var(--text-3);max-width:440px;margin:0 auto 20px;font-size:0.9rem;">Try adjusting your search criteria, property type, or budget to view available luxury listings.</p>
        <button class="btn btn-gold btn-sm" onclick="resetSearchFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = properties.map((prop, index) => {
    const isFav = LuxStore.isFavorite(prop.id);
    const badgeClass = prop.category === 'rent' ? 'rent' : 'buy';
    const badgeLabel = prop.badge || (prop.category === 'rent' ? 'For Rent' : 'For Sale');

    return `
      <article class="property-card ${prop.isNew ? 'property-card--featured' : ''}" data-id="${prop.id}" style="animation-delay:${index * 0.08}s">
        <div class="property-img">
          <img src="${prop.img}" alt="${escapeHtml(prop.name)} in ${escapeHtml(prop.location)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'" />
          <div class="property-badge ${badgeClass}">${escapeHtml(badgeLabel)}</div>
          ${prop.isNew ? '<div class="property-badge new-tag">New Launch</div>' : ''}
          <button class="property-heart ${isFav ? 'liked' : ''}" aria-label="Save ${escapeHtml(prop.name)} to favorites" onclick="handleHeartClick(event, ${prop.id})">
            ${isFav ? '♥' : '♡'}
          </button>
          <div class="property-overlay">
            <button class="btn btn-gold btn-sm" onclick="openPropDetails(${prop.id})">View Details</button>
          </div>
        </div>
        <div class="property-body" onclick="openPropDetails(${prop.id})" style="cursor:pointer;">
          <div class="property-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${escapeHtml(prop.location)}
          </div>
          <h3 class="property-name">${escapeHtml(prop.name)}</h3>
          <div class="property-specs">
            <span>🛏 ${prop.beds} Beds</span>
            <span>🛁 ${prop.baths} Baths</span>
            <span>📐 ${Number(prop.sqft).toLocaleString()} sq ft</span>
          </div>
          <div class="property-footer">
            <div class="property-price">${escapeHtml(prop.price)}</div>
            <div class="property-rating">⭐ ${prop.rating || '5.0'} (${prop.reviewsCount || 12} reviews)</div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// ============================================================
// 7. HERO SEARCH INTEGRATION
// ============================================================
function initHeroSearch() {
  const searchBtn = document.getElementById('search-btn');
  const locInput = document.getElementById('location-input');
  const typeSelect = document.getElementById('type-select');
  const budgetSelect = document.getElementById('budget-select');
  const searchTabs = document.querySelectorAll('.search-tab');

  searchTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      searchTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.getAttribute('data-filter');
      currentFilter.category = cat === 'invest' ? 'buy' : cat;
    });
  });

  const runSearch = () => {
    currentFilter.query = locInput ? locInput.value.trim() : '';
    currentFilter.type = typeSelect ? typeSelect.value : '';
    currentFilter.budget = budgetSelect ? budgetSelect.value : '';

    renderProperties(currentFilter);

    // Sync filter button tab
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === currentFilter.category);
    });

    // Smooth scroll down to listings
    const target = document.getElementById('listings');
    if (target) {
      const navH = document.getElementById('navbar')?.offsetHeight || 80;
      const top = target.getBoundingClientRect().top + window.scrollY - navH + 10;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  if (searchBtn) searchBtn.addEventListener('click', runSearch);
  if (locInput) {
    locInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runSearch();
    });
  }
}

function resetSearchFilters() {
  currentFilter = { category: 'all', query: '', type: '', budget: '' };
  const locInput = document.getElementById('location-input');
  const typeSelect = document.getElementById('type-select');
  const budgetSelect = document.getElementById('budget-select');
  if (locInput) locInput.value = '';
  if (typeSelect) typeSelect.value = '';
  if (budgetSelect) budgetSelect.value = '';

  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-filter') === 'all');
  });
  document.querySelectorAll('.search-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-filter') === 'buy');
  });

  renderProperties(currentFilter);
  showToast('Filters cleared. Showing all luxury listings.', 'info');
}

// ============================================================
// 8. PROPERTY DETAILS MODAL & GALLERY
// ============================================================
let activeModalProperty = null;
let activeGalleryIndex = 0;

function openPropDetails(id) {
  const prop = LuxStore.getPropertyById(id);
  if (!prop) return;

  activeModalProperty = prop;
  activeGalleryIndex = 0;

  const mount = document.getElementById('prop-details-mount');
  const overlay = document.getElementById('prop-details-modal');
  if (!mount || !overlay) return;

  const isFav = LuxStore.isFavorite(prop.id);
  const images = prop.gallery && prop.gallery.length ? prop.gallery : [prop.img];

  const thumbsHtml = images.map((img, i) => `
    <img src="${img}" class="prop-thumb-item ${i === 0 ? 'active' : ''}" onclick="switchGalleryImg(${i})" alt="Thumbnail ${i + 1}" />
  `).join('');

  const featuresHtml = (prop.features || []).map(f => `
    <div class="amenity-chip"><span>✦</span> ${escapeHtml(f)}</div>
  `).join('');

  mount.innerHTML = `
    <div class="prop-modal-gallery">
      <img src="${images[0]}" id="modal-main-gallery-img" class="prop-gallery-main" alt="${escapeHtml(prop.name)}" />
      ${images.length > 1 ? `
        <div class="prop-gallery-nav">
          <button class="prop-gallery-btn" onclick="prevGalleryImg()" aria-label="Previous image">‹</button>
          <button class="prop-gallery-btn" onclick="nextGalleryImg()" aria-label="Next image">›</button>
        </div>
        <div class="prop-gallery-thumbs" id="modal-gallery-thumbs">
          ${thumbsHtml}
        </div>
      ` : ''}
    </div>

    <div class="prop-modal-body">
      <div class="prop-modal-header">
        <div>
          <div class="property-badge ${prop.category === 'rent' ? 'rent' : 'buy'}" style="position:static;display:inline-block;margin-bottom:8px;">
            ${escapeHtml(prop.badge || (prop.category === 'rent' ? 'For Rent' : 'For Sale'))}
          </div>
          <h2 class="prop-modal-title">${escapeHtml(prop.name)}</h2>
          <div class="prop-modal-location">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${escapeHtml(prop.address || prop.location)}
          </div>
        </div>
        <div>
          <div class="prop-modal-price">${escapeHtml(prop.price)}</div>
          <div style="font-size:0.8rem;color:var(--text-3);text-align:right;">ID: ${escapeHtml(prop.propertyId || 'LUX-' + prop.id)}</div>
        </div>
      </div>

      <div class="prop-modal-specs-grid">
        <div class="spec-box"><div class="spec-box-icon">🛏</div><div class="spec-box-val">${prop.beds} Beds</div><div class="spec-box-lbl">Bedrooms</div></div>
        <div class="spec-box"><div class="spec-box-icon">🛁</div><div class="spec-box-val">${prop.baths} Baths</div><div class="spec-box-lbl">Bathrooms</div></div>
        <div class="spec-box"><div class="spec-box-icon">📐</div><div class="spec-box-val">${Number(prop.sqft).toLocaleString()}</div><div class="spec-box-lbl">Sq. Footage</div></div>
        <div class="spec-box"><div class="spec-box-icon">🏛</div><div class="spec-box-val">${prop.yearBuilt || '2023'}</div><div class="spec-box-lbl">Year Built</div></div>
        <div class="spec-box"><div class="spec-box-icon">🚗</div><div class="spec-box-val">${escapeHtml(prop.garage || 'Private')}</div><div class="spec-box-lbl">Garage</div></div>
        <div class="spec-box"><div class="spec-box-icon">📜</div><div class="spec-box-val">${escapeHtml(prop.hoa || '$1,500/mo')}</div><div class="spec-box-lbl">HOA / Fees</div></div>
      </div>

      <div class="prop-modal-section-title">
        <span>📖</span> Property Narrative &amp; Highlights
      </div>
      <p class="prop-modal-desc">${escapeHtml(prop.description || '')}</p>

      <div class="prop-modal-section-title">
        <span>✨</span> Exclusive Amenities &amp; Features
      </div>
      <div class="amenities-cloud">
        ${featuresHtml}
      </div>

      <div class="prop-modal-agent-row">
        <div class="agent-snippet">
          <div class="agent-snippet-avatar">${escapeHtml(prop.agent?.initials || 'VS')}</div>
          <div>
            <div class="agent-snippet-name">${escapeHtml(prop.agent?.name || 'Victoria Sterling')}</div>
            <div class="agent-snippet-role">${escapeHtml(prop.agent?.role || 'Senior Luxury Broker')} &bull; ${escapeHtml(prop.agent?.phone || '+1 800 589-LUXE')}</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm" onclick="handleHeartClick(event, ${prop.id}); toggleModalFavBtn(this, ${prop.id});">
            ${isFav ? '♥ Saved in Favorites' : '♡ Add to Favorites'}
          </button>
          <button class="btn btn-gold btn-sm" onclick="openTourBookingForProp(${prop.id})">
            Schedule Private Tour
          </button>
        </div>
      </div>
    </div>
  `;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePropModal() {
  const overlay = document.getElementById('prop-details-modal');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function handlePropModalClick(e) {
  if (e.target === document.getElementById('prop-details-modal')) {
    closePropModal();
  }
}

function switchGalleryImg(index) {
  if (!activeModalProperty || !activeModalProperty.gallery) return;
  const images = activeModalProperty.gallery;
  activeGalleryIndex = (index + images.length) % images.length;

  const mainImg = document.getElementById('modal-main-gallery-img');
  if (mainImg) {
    mainImg.style.opacity = '0.4';
    setTimeout(() => {
      mainImg.src = images[activeGalleryIndex];
      mainImg.style.opacity = '1';
    }, 150);
  }

  const thumbs = document.querySelectorAll('.prop-thumb-item');
  thumbs.forEach((t, i) => t.classList.toggle('active', i === activeGalleryIndex));
}

function nextGalleryImg() { switchGalleryImg(activeGalleryIndex + 1); }
function prevGalleryImg() { switchGalleryImg(activeGalleryIndex - 1); }

function toggleModalFavBtn(btn, propId) {
  const isFav = LuxStore.isFavorite(propId);
  btn.innerHTML = isFav ? '♥ Saved in Favorites' : '♡ Add to Favorites';
}

// ============================================================
// 9. FAVORITES / SAVED PROPERTIES DRAWER
// ============================================================
function initFavoritesSystem() {
  updateFavoritesUI();
}

function handleHeartClick(e, propId) {
  e.stopPropagation();
  const heart = e.currentTarget;
  const isNowFav = LuxStore.toggleFavorite(propId);

  heart.classList.toggle('liked', isNowFav);
  heart.textContent = isNowFav ? '♥' : '♡';
  heart.style.transform = 'scale(1.4)';
  setTimeout(() => heart.style.transform = '', 200);

  updateFavoritesUI();
  showToast(isNowFav ? 'Added to Saved Properties!' : 'Removed from Saved Properties', isNowFav ? 'success' : 'info');
}

function updateFavoritesUI() {
  const favs = LuxStore.getFavoriteProperties();
  const badges = document.querySelectorAll('#nav-fav-badge, #mobile-fav-badge');
  badges.forEach(b => {
    b.textContent = favs.length;
    b.style.display = favs.length > 0 ? 'inline-block' : 'none';
  });

  const drawerItems = document.getElementById('fav-drawer-items');
  if (!drawerItems) return;

  if (!favs.length) {
    drawerItems.innerHTML = `
      <div style="text-align:center;padding:60px 10px;color:var(--text-3);">
        <div style="font-size:2.5rem;margin-bottom:12px;opacity:0.5;">♡</div>
        <p style="font-size:.92rem;margin-bottom:8px;">No saved properties yet.</p>
        <p style="font-size:.8rem;color:var(--text-4);">Click the heart icon on any listing to save it here for quick access.</p>
      </div>
    `;
    return;
  }

  drawerItems.innerHTML = favs.map(p => `
    <div class="fav-card-item">
      <img src="${p.img}" alt="${escapeHtml(p.name)}" class="fav-thumb" onerror="this.src='https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=80&q=60'" />
      <div class="fav-info">
        <div class="fav-name">${escapeHtml(p.name)}</div>
        <div class="fav-loc">📍 ${escapeHtml(p.location)}</div>
        <div class="fav-price">${escapeHtml(p.price)}</div>
        <div style="margin-top:6px;">
          <button class="btn btn-gold btn-sm" style="padding:4px 10px;font-size:.75rem;" onclick="closeFavDrawer(); openPropDetails(${p.id});">View Details</button>
        </div>
      </div>
      <button class="fav-remove-btn" onclick="removeFavoriteItem(${p.id})" title="Remove">✕</button>
    </div>
  `).join('');
}

function removeFavoriteItem(propId) {
  LuxStore.removeFavorite(propId);
  updateFavoritesUI();
  renderProperties(currentFilter);
  showToast('Removed from saved properties.', 'info');
}

function toggleFavDrawer() {
  const overlay = document.getElementById('fav-drawer-overlay');
  if (overlay) {
    overlay.classList.toggle('open');
    updateFavoritesUI();
  }
}

function closeFavDrawer() {
  const overlay = document.getElementById('fav-drawer-overlay');
  if (overlay) overlay.classList.remove('open');
}

function handleFavOverlayClick(e) {
  if (e.target === document.getElementById('fav-drawer-overlay')) {
    closeFavDrawer();
  }
}

// ============================================================
// 10. LUXURY MORTGAGE CALCULATOR
// ============================================================
function initMortgageCalculator() {
  const priceInput = document.getElementById('calc-price');
  const downInput  = document.getElementById('calc-down');
  const rateInput  = document.getElementById('calc-rate');
  const termInputs = document.querySelectorAll('input[name="calc-term"]');

  if (!priceInput || !downInput || !rateInput) return;

  const update = () => {
    const homePrice = parseFloat(priceInput.value) || 8500000;
    const downPct   = parseFloat(downInput.value) || 20;
    const ratePct   = parseFloat(rateInput.value) || 5.8;
    let termYears = 30;
    termInputs.forEach(r => { if (r.checked) termYears = parseInt(r.value, 10); });

    document.getElementById('calc-price-display').textContent = '$' + homePrice.toLocaleString();
    document.getElementById('calc-down-display').textContent  = downPct + '% ($' + Math.round(homePrice * (downPct / 100)).toLocaleString() + ')';
    document.getElementById('calc-rate-display').textContent  = ratePct.toFixed(1) + '%';

    const loanAmount = homePrice * (1 - downPct / 100);
    const monthlyRate = (ratePct / 100) / 12;
    const numPayments = termYears * 12;

    // Monthly principal & interest formula: P * (r*(1+r)^n) / ((1+r)^n - 1)
    let monthlyPI = 0;
    if (monthlyRate > 0) {
      monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    } else {
      monthlyPI = loanAmount / numPayments;
    }

    const monthlyTax = (homePrice * 0.011) / 12; // ~1.1% property tax
    const monthlyIns = (homePrice * 0.0035) / 12; // ~0.35% homeowners insurance
    const monthlyHOA = 1800; // estimated luxury HOA

    const totalMonthly = Math.round(monthlyPI + monthlyTax + monthlyIns + monthlyHOA);

    document.getElementById('calc-monthly-total').textContent = '$' + totalMonthly.toLocaleString();
    document.getElementById('calc-pi-val').textContent  = '$' + Math.round(monthlyPI).toLocaleString();
    document.getElementById('calc-tax-val').textContent = '$' + Math.round(monthlyTax).toLocaleString();
    document.getElementById('calc-ins-val').textContent = '$' + Math.round(monthlyIns).toLocaleString();
    document.getElementById('calc-hoa-val').textContent = '$' + monthlyHOA.toLocaleString();
  };

  priceInput.addEventListener('input', update);
  downInput.addEventListener('input', update);
  rateInput.addEventListener('input', update);
  termInputs.forEach(r => r.addEventListener('change', update));

  update();
}

// ============================================================
// 11. TOUR BOOKING MODAL
// ============================================================
function initTourModal() {
  // Pre-fill tomorrow as minimum date
  const dateInput = document.getElementById('tour-date');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
    dateInput.value = tomorrow.toISOString().split('T')[0];
  }
}

function openTourBookingForProp(id) {
  closePropModal();
  const prop = LuxStore.getPropertyById(id);
  const modal = document.getElementById('tour-modal');
  if (!prop || !modal) return;

  document.getElementById('tour-prop-id').value = prop.id;
  document.getElementById('tour-prop-name').value = prop.name;
  document.getElementById('tour-prop-subtitle').textContent = `Private showing for ${prop.name} (${prop.location})`;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeTourModal() {
  const modal = document.getElementById('tour-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
}

function handleTourModalClick(e) {
  if (e.target === document.getElementById('tour-modal')) closeTourModal();
}

function submitTourBooking(e) {
  e.preventDefault();
  const propName = document.getElementById('tour-prop-name').value || 'Luxury Property';
  const propId   = document.getElementById('tour-prop-id').value;
  const format   = document.querySelector('input[name="tour-format"]:checked')?.value || 'In-Person VIP Tour';
  const date     = document.getElementById('tour-date').value;
  const time     = document.getElementById('tour-time').value;
  const name     = document.getElementById('tour-name').value.trim();
  const email    = document.getElementById('tour-email').value.trim();
  const phone    = document.getElementById('tour-phone').value.trim();

  LuxStore.addInquiry({
    sender: name,
    email,
    phone,
    property: propName,
    propertyId: propId ? Number(propId) : null,
    interest: 'tour',
    tourType: format,
    date: `${date} at ${time}`,
    budget: 'Qualified VIP Buyer',
    message: `Scheduled ${format} on ${date} at ${time}. Client contact: ${phone || email}.`
  });

  closeTourModal();
  e.target.reset();
  showToast(`Tour requested for ${propName}! Our concierge will contact you within 2 hours.`, 'success');
}

// ============================================================
// 12. CONTACT & NEWSLETTER FORMS
// ============================================================
function initContactForm() {
  const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  const submitBtn = document.getElementById('form-submit-btn');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fname = form.querySelector('#fname')?.value.trim();
    const lname = form.querySelector('#lname')?.value.trim();
    const email = form.querySelector('#email')?.value.trim();
    const phone = form.querySelector('#phone')?.value.trim();
    const interest = form.querySelector('#interest')?.value;
    const message = form.querySelector('#message')?.value.trim();

    if (!fname || !email) {
      shakeElement(form);
      showToast('Please enter your name and email.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting Inquiry...';

    setTimeout(() => {
      LuxStore.addInquiry({
        sender: `${fname} ${lname || ''}`.trim(),
        email,
        phone,
        property: 'Bespoke Consultation Request',
        interest: interest || 'buy',
        tourType: 'Contact Form Lead',
        message: message || `Inquiring about ${interest || 'luxury'} opportunities.`
      });

      submitBtn.disabled = false;
      submitBtn.innerHTML = `Send Message <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>`;
      if (success) success.removeAttribute('hidden');
      form.reset();
      showToast('Thank you! Your private consultation request was sent to our senior partners.', 'success');

      setTimeout(() => { if (success) success.setAttribute('hidden', ''); }, 8000);
    }, 800);
  });
}

function initNewsletterForm() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    if (!input || !input.value.trim()) return;

    const email = input.value.trim();
    LuxStore.addInquiry({
      sender: 'Newsletter Subscriber',
      email,
      property: 'Market Insights Digest',
      tourType: 'Newsletter Lead',
      message: `Subscribed to weekly off-market property alerts.`
    });

    const btn = form.querySelector('button');
    btn.textContent = '✓';
    btn.style.background = '#4ca87a';
    input.value = '';
    input.placeholder = 'Welcome to LuxEstate VIP!';
    showToast('Subscribed to private market intelligence.', 'success');

    setTimeout(() => {
      btn.textContent = '→';
      btn.style.background = '';
      input.placeholder = 'your@email.com';
    }, 4000);
  });
}

// ============================================================
// 13. TESTIMONIALS CAROUSEL
// ============================================================
function initTestimonials() {
  const track = document.getElementById('testimonials-track');
  const prevBtn = document.getElementById('testi-prev-btn');
  const nextBtn = document.getElementById('testi-next-btn');
  const dotsWrap = document.getElementById('testi-dots');
  if (!track || !dotsWrap) return;

  const cards = Array.from(track.querySelectorAll('.testimonial-card'));
  if (!cards.length) return;

  let current = 0;
  let autoTimer = null;

  dotsWrap.innerHTML = '';
  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'testi-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Testimonial ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const getDots = () => Array.from(dotsWrap.querySelectorAll('.testi-dot'));

  const goTo = (index) => {
    cards[current].classList.remove('active');
    getDots()[current].classList.remove('active');

    current = (index + cards.length) % cards.length;

    cards[current].classList.add('active');
    getDots()[current].classList.add('active');
  };

  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  cards.forEach((c, idx) => c.classList.toggle('active', idx === 0));

  prevBtn && prevBtn.addEventListener('click', () => { prev(); resetAuto(); });
  nextBtn && nextBtn.addEventListener('click', () => { next(); resetAuto(); });

  const startAuto = () => { autoTimer = setInterval(next, 6000); };
  const resetAuto = () => { clearInterval(autoTimer); startAuto(); };

  startAuto();

  track.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.addEventListener('mouseleave', startAuto);
}

// ============================================================
// 14. BACK TO TOP & SMOOTH SCROLL
// ============================================================
function initBackToTop() {
  const btn = document.getElementById('back-to-top-btn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#' || !href) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const navHeight = document.getElementById('navbar')?.offsetHeight || 80;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// ============================================================
// UTILS & TOASTS
// ============================================================
function showToast(msg, type = 'info') {
  let container = document.getElementById('lux-toasts');
  if (!container) {
    container = document.createElement('div');
    container.id = 'lux-toasts';
    container.className = 'lux-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `lux-toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span><span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function shakeElement(el) {
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = 'shake 0.4s ease';
  el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

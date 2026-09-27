let allProducts = [];
let activeCategory = 'all';
let searchKeyword = '';
let activeSort = 'default';

async function fetchProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 60px 0;">
      <div style="font-size: 2rem; margin-bottom: 10px;">⏳</div>
      <p>Loading marketplace catalog...</p>
    </div>
  `;

  try {
    const data = await api('/products');
    allProducts = data.products || [];
    renderProducts();
  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px;" class="card">
        <span style="font-size: 2rem;">⚠️</span>
        <h3 style="margin: 10px 0;">Failed to load products</h3>
        <p>${err.message}</p>
        <button class="btn btn-primary btn-sm" onclick="fetchProducts()" style="margin-top: 15px;">Retry</button>
      </div>
    `;
  }
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  let filtered = [...allProducts];

  // Category filter
  if (activeCategory !== 'all') {
    filtered = filtered.filter(p => (p.category_name || '').toLowerCase() === activeCategory.toLowerCase());
  }

  // Search filter
  if (searchKeyword.trim()) {
    const q = searchKeyword.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.vendor_name && p.vendor_name.toLowerCase().includes(q))
    );
  }

  // Sort
  if (activeSort === 'price-low') {
    filtered.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (activeSort === 'price-high') {
    filtered.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (activeSort === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Render cards
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 0;" class="card">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
        <h3>No matching products found</h3>
        <p>Try searching for a different keyword or category.</p>
        <button class="btn btn-secondary btn-sm" onclick="resetFilters()" style="margin-top: 15px;">Reset Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const imgUrl = p.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop';
    return `
      <article class="product-card">
        <div class="product-img-wrapper">
          <img class="product-img" src="${imgUrl}" alt="${p.name}" loading="lazy">
          <div class="product-badge-overlay">
            <span class="badge badge-primary">${p.category_name || 'Market'}</span>
          </div>
          <div class="product-stock-tag">
            ${p.stock > 0 ? `📦 In Stock (${p.stock})` : '⚠️ Out of Stock'}
          </div>
        </div>
        <div class="product-content">
          <div class="product-vendor">
            🏪 ${p.vendor_name || 'Verified Vendor'}
          </div>
          <h3 class="product-title">${p.name}</h3>
          <p class="product-desc">${p.description || 'Quality product verified by softmulti_pro platform.'}</p>
          <div class="product-footer">
            <div class="product-price">₹${Number(p.price).toFixed(2)}</div>
            <button class="btn btn-primary btn-sm" onclick="addToCart(${p.id}, '${escapeHtml(p.name)}')">
              🛒 Add to Cart
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

async function addToCart(productId, productName) {
  const user = getSessionUser();
  if (!user) {
    showToast('Please log in as a customer to add items to cart.', 'error', 'Login Required');
    setTimeout(() => { location.href = 'login.html'; }, 1000);
    return;
  }

  if (user.role !== 'customer') {
    showToast('Only customer accounts can place items in cart.', 'error', 'Action Restricted');
    return;
  }

  try {
    await api('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity: 1 })
    });
    showToast(`${productName} added to your cart!`, 'success', 'Added to Cart');
    syncNavUI();
  } catch (err) {
    showToast(err.message, 'error', 'Cart Error');
  }
}

function setCategory(cat, element) {
  activeCategory = cat;
  document.querySelectorAll('.cat-pill').forEach(btn => btn.classList.remove('active'));
  if (element) element.classList.add('active');
  renderProducts();
}

function handleSearch(val) {
  searchKeyword = val;
  renderProducts();
}

function handleSort(val) {
  activeSort = val;
  renderProducts();
}

function resetFilters() {
  activeCategory = 'all';
  searchKeyword = '';
  activeSort = 'default';
  const searchInput = document.getElementById('search');
  if (searchInput) searchInput.value = '';
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.value = 'default';
  document.querySelectorAll('.cat-pill').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === 0);
  });
  renderProducts();
}

function escapeHtml(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

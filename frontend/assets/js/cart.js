let cartData = { items: [], subtotal: 0 };

async function loadCart() {
  if (!requireAuth(['customer'])) return;

  const container = document.getElementById('cartContainer');
  const summaryBox = document.getElementById('orderSummary');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 40px 0;">
      <div style="font-size: 2rem; margin-bottom: 8px;">⏳</div>
      <p>Retrieving your cart items...</p>
    </div>
  `;

  try {
    const data = await api('/cart');
    cartData.items = data.items || [];
    renderCart();
  } catch (err) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 40px;">
        <span style="font-size: 2rem;">⚠️</span>
        <h3 style="margin: 10px 0;">Unable to load cart</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}

function renderCart() {
  const container = document.getElementById('cartContainer');
  const summaryBox = document.getElementById('orderSummary');
  const items = cartData.items;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3.5rem; margin-bottom: 16px;">🛒</div>
        <h2>Your Cart is Empty</h2>
        <p style="margin: 12px 0 24px;">Explore our multi-vendor marketplace to discover farm-fresh goods, crafts, books, and more!</p>
        <a href="products.html" class="btn btn-primary">Browse Marketplace</a>
      </div>
    `;
    if (summaryBox) summaryBox.style.display = 'none';
    syncNavUI();
    return;
  }

  if (summaryBox) summaryBox.style.display = 'block';

  let subtotal = 0;

  container.innerHTML = items.map(item => {
    const itemTotal = Number(item.price) * item.quantity;
    subtotal += itemTotal;
    const imgUrl = item.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop';

    return `
      <div class="card" style="margin-bottom: 16px; padding: 18px; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <img src="${imgUrl}" alt="${item.name}" style="width: 72px; height: 72px; border-radius: var(--radius-md); object-fit: cover; background: #111;">
          <div>
            <div class="badge badge-primary" style="margin-bottom: 4px; font-size: 0.7rem;">${item.category_name || 'Market Item'}</div>
            <h4 style="font-size: 1.1rem; color: #fff;">${item.name}</h4>
            <div style="color: var(--accent-cyan); font-weight: 700; font-size: 0.95rem;">₹${Number(item.price).toFixed(2)} each</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 24px;">
          <div style="display: flex; align-items: center; background: rgba(255,255,255,0.06); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); overflow: hidden;">
            <button class="btn btn-secondary btn-sm" style="padding: 6px 12px; border-radius: 0;" onclick="changeQty(${item.id}, ${item.quantity - 1})">-</button>
            <span style="padding: 0 14px; font-weight: 700; font-size: 0.95rem;">${item.quantity}</span>
            <button class="btn btn-secondary btn-sm" style="padding: 6px 12px; border-radius: 0;" onclick="changeQty(${item.id}, ${item.quantity + 1})">+</button>
          </div>

          <div style="min-width: 90px; text-align: right;">
            <div style="font-size: 1.15rem; font-weight: 800; color: #fff;">₹${itemTotal.toFixed(2)}</div>
          </div>

          <button class="btn btn-danger btn-sm" onclick="deleteCartItem(${item.id})" title="Remove item">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Update Summary Calculations
  const shipping = subtotal > 500 ? 0 : 49;
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + shipping + tax;

  cartData.subtotal = subtotal;
  cartData.shipping = shipping;
  cartData.tax = tax;
  cartData.grandTotal = grandTotal;

  document.getElementById('sumSubtotal').textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById('sumShipping').textContent = shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`;
  document.getElementById('sumTax').textContent = `₹${tax.toFixed(2)}`;
  document.getElementById('sumTotal').textContent = `₹${grandTotal.toFixed(2)}`;

  syncNavUI();
}

async function changeQty(cartItemId, newQty) {
  if (newQty <= 0) {
    return deleteCartItem(cartItemId);
  }
  try {
    await api(`/cart/${cartItemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity: newQty })
    });
    loadCart();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteCartItem(cartItemId) {
  try {
    await api(`/cart/${cartItemId}`, { method: 'DELETE' });
    showToast('Item removed from cart', 'info');
    loadCart();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function proceedToCheckout() {
  if (cartData.items.length === 0) {
    showToast('Your cart is empty', 'error');
    return;
  }
  localStorage.setItem('softmulti_checkout', JSON.stringify({
    items: cartData.items,
    total: cartData.grandTotal
  }));
  window.location.href = 'payment.html';
}

document.addEventListener('DOMContentLoaded', loadCart);

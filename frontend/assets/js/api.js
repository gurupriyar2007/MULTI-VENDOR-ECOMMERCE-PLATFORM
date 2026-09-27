const API_BASE = 'http://localhost:5000/api';

/**
 * Universal Toast Notification System
 */
function showToast(message, type = 'info', title = '') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <div class="toast-content">
      ${title ? `<div class="toast-title">${title}</div>` : ''}
      <div>${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

/**
 * Core API Request Method
 */
async function api(path, options = {}) {
  const token = localStorage.getItem('softmulti_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(API_BASE + path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      const errMsg = data.message || `Request failed with status ${res.status}`;
      throw new Error(errMsg);
    }
    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * Session & Authentication Helpers
 */
function saveSession(data) {
  localStorage.setItem('softmulti_token', data.token);
  localStorage.setItem('softmulti_user', JSON.stringify(data.user));
}

function getSessionUser() {
  try {
    return JSON.parse(localStorage.getItem('softmulti_user') || 'null');
  } catch {
    return null;
  }
}

function getToken() {
  return localStorage.getItem('softmulti_token');
}

function logout() {
  localStorage.removeItem('softmulti_token');
  localStorage.removeItem('softmulti_user');
  showToast('Logged out successfully', 'info');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 400);
}

function requireAuth(allowedRoles = []) {
  const user = getSessionUser();
  if (!user || !getToken()) {
    showToast('Please login to continue', 'error');
    setTimeout(() => { window.location.href = 'login.html'; }, 600);
    return false;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    showToast('Access denied for your role', 'error');
    setTimeout(() => { window.location.href = 'index.html'; }, 600);
    return false;
  }

  return true;
}

/**
 * Updates UI Header (User chip, Cart count, Role badge)
 */
async function syncNavUI() {
  const user = getSessionUser();
  const navActions = document.getElementById('navActions');
  const cartBadge = document.getElementById('cartBadge');

  if (navActions) {
    if (user) {
      let dashboardUrl = 'customer-dashboard.html';
      if (user.role === 'vendor') dashboardUrl = 'vendor-dashboard.html';
      if (user.role === 'admin') dashboardUrl = 'admin-dashboard.html';

      navActions.innerHTML = `
        <a href="cart.html" class="cart-btn" title="View Cart">
          🛒
          <span class="cart-badge" id="cartBadge" style="display:none">0</span>
        </a>
        <div class="user-chip" onclick="location.href='${dashboardUrl}'" title="Open Dashboard">
          <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
          <span style="font-weight:600;font-size:0.9rem;">${user.name}</span>
          <span class="badge badge-primary" style="font-size:0.7rem;">${user.role}</span>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="logout()">Logout</button>
      `;
    } else {
      navActions.innerHTML = `
        <a href="cart.html" class="cart-btn" title="View Cart">
          🛒
          <span class="cart-badge" id="cartBadge" style="display:none">0</span>
        </a>
        <a href="login.html" class="btn btn-secondary btn-sm">Sign In</a>
        <a href="register.html" class="btn btn-primary btn-sm">Join</a>
      `;
    }
  }

  // Update Cart badge if user is customer
  if (user && user.role === 'customer') {
    try {
      const data = await api('/cart');
      const badge = document.getElementById('cartBadge');
      if (badge && data.items) {
        const count = data.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        if (count > 0) {
          badge.textContent = count;
          badge.style.display = 'grid';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch (e) {
      // ignore
    }
  }
}

// Automatically sync navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', syncNavUI);

/**
 * Customer Dashboard Logic
 */
async function loadCustomerDashboard() {
  if (!requireAuth(['customer'])) return;
  const user = getSessionUser();
  
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name);
  document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = user.email);

  const ordersContainer = document.getElementById('customerOrders');
  if (!ordersContainer) return;

  try {
    const data = await api('/orders/customer');
    const orders = data.orders || [];

    let totalSpent = 0;
    let activeOrders = 0;
    let completedOrders = 0;

    orders.forEach(o => {
      totalSpent += Number(o.total_amount);
      if (o.status === 'delivered') completedOrders++;
      else if (o.status !== 'cancelled') activeOrders++;
    });

    const statSpent = document.getElementById('statTotalSpent');
    const statActive = document.getElementById('statActiveOrders');
    const statCompleted = document.getElementById('statCompletedOrders');

    if (statSpent) statSpent.textContent = `₹${totalSpent.toFixed(2)}`;
    if (statActive) statActive.textContent = activeOrders;
    if (statCompleted) statCompleted.textContent = completedOrders;

    if (orders.length === 0) {
      ordersContainer.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px;">
            <p>You haven't placed any orders yet.</p>
            <a href="products.html" class="btn btn-primary btn-sm" style="margin-top: 10px;">Start Shopping</a>
          </td>
        </tr>
      `;
      return;
    }

    ordersContainer.innerHTML = orders.map(o => {
      const statusBadge = getStatusBadge(o.status);
      const payBadge = o.payment_status === 'paid' 
        ? '<span class="badge badge-emerald">PAID</span>' 
        : '<span class="badge badge-amber">PENDING</span>';

      return `
        <tr>
          <td><strong style="color:#fff;">#ORD-${o.id}</strong></td>
          <td>₹${Number(o.total_amount).toFixed(2)}</td>
          <td>${statusBadge}</td>
          <td>${payBadge}</td>
          <td>
            <a href="order-tracking.html?orderId=${o.id}" class="btn btn-secondary btn-sm">
              📍 Track Order
            </a>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    ordersContainer.innerHTML = `<tr><td colspan="5" style="color:var(--accent-rose);">${err.message}</td></tr>`;
  }
}

/**
 * Vendor Dashboard Logic
 */
async function loadVendorDashboard() {
  if (!requireAuth(['vendor'])) return;
  const user = getSessionUser();
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name);

  try {
    const dash = await api('/vendors/dashboard');
    if (dash && dash.stats) {
      document.getElementById('vendorSales').textContent = `₹${Number(dash.stats.sales || 0).toFixed(2)}`;
      document.getElementById('vendorOrderCount').textContent = dash.stats.orders || 0;
      document.getElementById('vendorProductCount').textContent = dash.stats.products || 0;
    }

    const ordersData = await api('/orders/vendor');
    const tableBody = document.getElementById('vendorOrdersTable');
    if (!tableBody) return;

    const orders = ordersData.orders || [];
    if (orders.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px;">No incoming orders yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = orders.map(o => `
      <tr>
        <td><strong>#ORD-${o.id}</strong></td>
        <td>${o.customer_name || 'Customer'}</td>
        <td><strong>₹${Number(o.total_amount).toFixed(2)}</strong></td>
        <td>${getStatusBadge(o.status)}</td>
        <td>
          <select class="form-control" style="padding:6px 10px; font-size:0.85rem;" onchange="updateOrderStatus(${o.id}, this.value)">
            <option value="placed" ${o.status==='placed'?'selected':''}>Placed</option>
            <option value="confirmed" ${o.status==='confirmed'?'selected':''}>Confirmed</option>
            <option value="packed" ${o.status==='packed'?'selected':''}>Packed</option>
            <option value="shipped" ${o.status==='shipped'?'selected':''}>Shipped</option>
            <option value="delivered" ${o.status==='delivered'?'selected':''}>Delivered</option>
            <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Cancelled</option>
          </select>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    await api(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    showToast(`Order #ORD-${orderId} status changed to ${newStatus.toUpperCase()}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * Admin Dashboard Logic
 */
async function loadAdminDashboard() {
  if (!requireAuth(['admin'])) return;

  try {
    const statsData = await api('/admin/stats');
    if (statsData && statsData.stats) {
      document.getElementById('adminUsers').textContent = statsData.stats.users || 0;
      document.getElementById('adminProducts').textContent = statsData.stats.products || 0;
      document.getElementById('adminOrders').textContent = statsData.stats.orders || 0;
      document.getElementById('adminRevenue').textContent = `₹${Number(statsData.stats.revenue || 0).toFixed(2)}`;
    }

    const pendingData = await api('/admin/vendors/pending');
    const tableBody = document.getElementById('adminVendorsTable');
    if (!tableBody) return;

    const vendors = pendingData.vendors || [];
    if (vendors.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--text-muted);">No vendors awaiting approval at this time.</td></tr>`;
      return;
    }

    tableBody.innerHTML = vendors.map(v => `
      <tr>
        <td><strong>${v.name}</strong></td>
        <td>${v.email}</td>
        <td><span class="badge badge-amber">PENDING</span></td>
        <td>
          <button class="btn btn-success btn-sm" onclick="approveVendor(${v.id}, '${escapeHtml(v.name)}')">
            ✓ Approve
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function approveVendor(id, name) {
  try {
    await api(`/admin/vendors/${id}/approve`, { method: 'PUT' });
    showToast(`Vendor "${name}" has been approved!`, 'success');
    loadAdminDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * Order Tracking Logic
 */
async function loadOrderTracking() {
  const urlParams = new URLSearchParams(window.location.search);
  let orderId = urlParams.get('orderId');

  const container = document.getElementById('trackingContainer');
  if (!container) return;

  const user = getSessionUser();
  if (!user) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 40px;">
        <h3>Login Required</h3>
        <p>Please log in to track your order.</p>
        <a href="login.html" class="btn btn-primary" style="margin-top:15px;">Login</a>
      </div>
    `;
    return;
  }

  try {
    const data = await api('/orders/customer');
    const orders = data.orders || [];

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding:50px;">
          <h3>No Orders Found</h3>
          <p>You have not placed any orders to track.</p>
          <a href="products.html" class="btn btn-primary" style="margin-top:15px;">Go to Store</a>
        </div>
      `;
      return;
    }

    // Default to latest order if orderId not specified
    let targetOrder = orders.find(o => String(o.id) === String(orderId));
    if (!targetOrder) targetOrder = orders[0];

    const steps = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];
    const currentStepIndex = steps.indexOf(targetOrder.status.toLowerCase());
    const progressPercent = currentStepIndex >= 0 ? (currentStepIndex / (steps.length - 1)) * 100 : 0;

    container.innerHTML = `
      <div class="card" style="margin-bottom: 24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:20px;">
          <div>
            <div class="badge badge-primary" style="margin-bottom:6px;">LIVE TRACKING</div>
            <h2>Order #ORD-${targetOrder.id}</h2>
            <p>Total: <strong style="color:#fff;">₹${Number(targetOrder.total_amount).toFixed(2)}</strong> | Status: ${getStatusBadge(targetOrder.status)}</p>
          </div>
          <div>
            <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:4px;">Switch Order:</label>
            <select class="form-control" onchange="location.href='order-tracking.html?orderId=' + this.value" style="padding:8px 12px;">
              ${orders.map(o => `<option value="${o.id}" ${o.id===targetOrder.id?'selected':''}>#ORD-${o.id} (₹${o.total_amount})</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Stepper -->
        <div class="stepper">
          <div class="stepper-progress" style="width: ${progressPercent}%;"></div>
          
          <div class="step-node ${currentStepIndex >= 0 ? (currentStepIndex > 0 ? 'completed' : 'active') : ''}">
            <div class="step-dot">${currentStepIndex > 0 ? '✓' : '1'}</div>
            <div class="step-label">Placed</div>
          </div>

          <div class="step-node ${currentStepIndex >= 1 ? (currentStepIndex > 1 ? 'completed' : 'active') : ''}">
            <div class="step-dot">${currentStepIndex > 1 ? '✓' : '2'}</div>
            <div class="step-label">Confirmed</div>
          </div>

          <div class="step-node ${currentStepIndex >= 2 ? (currentStepIndex > 2 ? 'completed' : 'active') : ''}">
            <div class="step-dot">${currentStepIndex > 2 ? '✓' : '3'}</div>
            <div class="step-label">Packed</div>
          </div>

          <div class="step-node ${currentStepIndex >= 3 ? (currentStepIndex > 3 ? 'completed' : 'active') : ''}">
            <div class="step-dot">${currentStepIndex > 3 ? '✓' : '4'}</div>
            <div class="step-label">Shipped</div>
          </div>

          <div class="step-node ${currentStepIndex >= 4 ? 'completed active' : ''}">
            <div class="step-dot">${currentStepIndex >= 4 ? '✓' : '5'}</div>
            <div class="step-label">Delivered</div>
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:20px; margin-top:20px;">
          <h4 style="margin-bottom:10px; color:#fff;">Status Timeline Note:</h4>
          <p style="font-size:0.95rem;">
            ${getStatusDescription(targetOrder.status)}
          </p>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card" style="color:var(--accent-rose);">${err.message}</div>`;
  }
}

function getStatusBadge(status) {
  const s = (status || '').toLowerCase();
  if (s === 'delivered') return '<span class="badge badge-emerald">DELIVERED</span>';
  if (s === 'shipped') return '<span class="badge badge-cyan">SHIPPED</span>';
  if (s === 'packed') return '<span class="badge badge-primary">PACKED</span>';
  if (s === 'confirmed') return '<span class="badge badge-primary">CONFIRMED</span>';
  if (s === 'cancelled') return '<span class="badge badge-rose">CANCELLED</span>';
  return '<span class="badge badge-amber">PLACED</span>';
}

function getStatusDescription(status) {
  const s = (status || '').toLowerCase();
  if (s === 'delivered') return 'Your package has been successfully delivered! Thank you for supporting independent marketplace vendors.';
  if (s === 'shipped') return 'Your package is on its way with the courier partner and will arrive shortly.';
  if (s === 'packed') return 'The vendor has prepared, packed and verified your products for shipment dispatch.';
  if (s === 'confirmed') return 'Order confirmed by the seller. Product allocation and packaging are in progress.';
  return 'Your order request has been received and routed to the respective vendor for confirmation.';
}

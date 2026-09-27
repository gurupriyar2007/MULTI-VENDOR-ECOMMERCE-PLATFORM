/**
 * In-Memory Fallback Database Adapter
 * Automatically activates on cloud platforms (e.g. Render) when an external MySQL server is not connected.
 * Ensures demo accounts, catalog, cart, orders, and dashboards work 100% out-of-the-box.
 */

let nextUserId = 4;
let nextProductId = 5;
let nextCartId = 2;
let nextCartItemId = 1;
let nextOrderId = 1;
let nextPaymentId = 1;

const users = [
  { id: 1, name: 'System Admin', email: 'admin@softmulti.local', password_hash: '$2a$10$L35ULs8RHQI5j6s56dZPl.TK8deJ2ld7ZvD68bP0S8xGb.cBEdtJe', role: 'admin', vendor_status: 'approved', created_at: new Date() },
  { id: 2, name: 'Demo Vendor', email: 'vendor@softmulti.local', password_hash: '$2a$10$QXkPLE1t.HAqVkoSg7XkUOW/i/AI91thgILzNJl/1VSzqdPdm7QdW', role: 'vendor', vendor_status: 'approved', created_at: new Date() },
  { id: 3, name: 'Demo Customer', email: 'customer@softmulti.local', password_hash: '$2a$10$411.VVD4bvcj4Uf62KwwwuIpplVzW/rMaQ6Zi5fDI/Uku5Lx/Oou2', role: 'customer', vendor_status: 'approved', created_at: new Date() }
];

const categories = [
  { id: 1, name: 'Agriculture', slug: 'agriculture' },
  { id: 2, name: 'Handmade Crafts', slug: 'crafts' },
  { id: 3, name: 'Books', slug: 'books' },
  { id: 4, name: 'Pharmacy', slug: 'pharmacy' },
  { id: 5, name: 'Other', slug: 'other' }
];

const products = [
  { id: 1, vendor_id: 2, category_id: 1, name: 'Fresh Farm Vegetables', description: 'Fresh vegetables supplied by local farmers.', price: '120.00', stock: 50, image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999', is_active: 1, created_at: new Date() },
  { id: 2, vendor_id: 2, category_id: 2, name: 'Handmade Craft Basket', description: 'Eco-friendly handmade basket.', price: '450.00', stock: 20, image_url: 'https://images.unsplash.com/photo-1529958030586-3aae4ca485ff', is_active: 1, created_at: new Date() },
  { id: 3, vendor_id: 2, category_id: 3, name: 'Programming Fundamentals', description: 'Beginner-friendly programming book.', price: '599.00', stock: 15, image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f', is_active: 1, created_at: new Date() },
  { id: 4, vendor_id: 2, category_id: 4, name: 'Wellness Essentials', description: 'General wellness products from an approved seller.', price: '299.00', stock: 25, image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae', is_active: 1, created_at: new Date() }
];

const carts = [
  { id: 1, customer_id: 3 }
];

const cartItems = [];
const orders = [];
const orderItems = [];
const payments = [];

async function query(sql, params = []) {
  const s = sql.trim().toLowerCase();

  // 1. Check user exists by email
  if (s.includes('select id from users where email')) {
    const email = params[0];
    const found = users.filter(u => u.email.toLowerCase() === (email || '').toLowerCase());
    return [found.map(u => ({ id: u.id }))];
  }

  // 2. Select user by email (login)
  if (s.includes('select * from users where email')) {
    const email = params[0];
    const found = users.filter(u => u.email.toLowerCase() === (email || '').toLowerCase());
    return [found];
  }

  // 3. Register user
  if (s.startsWith('insert into users')) {
    const [name, email, password_hash, role, vendor_status] = params;
    const newUser = { id: nextUserId++, name, email, password_hash, role, vendor_status, created_at: new Date() };
    users.push(newUser);
    return [{ insertId: newUser.id }];
  }

  // 4. List products
  if (s.includes('from products p join users u')) {
    let list = products.filter(p => p.is_active === 1).map(p => {
      const u = users.find(x => x.id === p.vendor_id);
      const c = categories.find(x => x.id === p.category_id);
      return {
        ...p,
        vendor_name: u ? u.name : 'Verified Vendor',
        category_name: c ? c.name : 'General'
      };
    });
    return [list];
  }

  // 5. Create product
  if (s.startsWith('insert into products')) {
    const [vendor_id, category_id, name, description, price, stock, image_url] = params;
    const p = { id: nextProductId++, vendor_id, category_id, name, description, price, stock, image_url, is_active: 1, created_at: new Date() };
    products.push(p);
    return [{ insertId: p.id }];
  }

  // 6. Delete product (soft)
  if (s.startsWith('update products set is_active=0')) {
    const [id, vendor_id] = params;
    const p = products.find(x => x.id === Number(id));
    if (p) p.is_active = 0;
    return [{ affectedRows: p ? 1 : 0 }];
  }

  // 7. Get Cart
  if (s.includes('from cart_items ci join carts c')) {
    const customerId = params[0];
    const cart = carts.find(c => c.customer_id === customerId);
    if (!cart) return [[]];
    const items = cartItems.filter(ci => ci.cart_id === cart.id).map(ci => {
      const p = products.find(prod => prod.id === ci.product_id) || {};
      const cat = categories.find(c => c.id === p.category_id);
      return {
        id: ci.id,
        product_id: ci.product_id,
        quantity: ci.quantity,
        name: p.name || 'Product',
        price: p.price || '0.00',
        image_url: p.image_url || '',
        category_name: cat ? cat.name : 'Category'
      };
    });
    return [items];
  }

  // 8. Find or create Cart
  if (s.includes('select id from carts where customer_id')) {
    const customerId = params[0];
    const found = carts.filter(c => c.customer_id === customerId);
    return [found];
  }

  if (s.startsWith('insert into carts')) {
    const customerId = params[0];
    const c = { id: nextCartId++, customer_id: customerId };
    carts.push(c);
    return [{ insertId: c.id }];
  }

  // 9. Add or update Cart item
  if (s.startsWith('insert into cart_items')) {
    const [cart_id, product_id, quantity] = params;
    const existing = cartItems.find(ci => ci.cart_id === cart_id && ci.product_id === product_id);
    if (existing) {
      existing.quantity += (quantity || 1);
      return [{ insertId: existing.id }];
    } else {
      const ci = { id: nextCartItemId++, cart_id, product_id, quantity: quantity || 1 };
      cartItems.push(ci);
      return [{ insertId: ci.id }];
    }
  }

  // 10. Update Cart item quantity
  if (s.includes('update cart_items ci join carts c')) {
    const [qty, itemId, customerId] = params;
    const ci = cartItems.find(x => x.id === Number(itemId));
    if (ci) ci.quantity = Number(qty);
    return [{ affectedRows: ci ? 1 : 0 }];
  }

  // 11. Remove from Cart
  if (s.includes('delete ci from cart_items ci join carts c')) {
    const [itemId, customerId] = params;
    const idx = cartItems.findIndex(x => x.id === Number(itemId));
    if (idx !== -1) cartItems.splice(idx, 1);
    return [{ affectedRows: 1 }];
  }

  // 12. Cart items for Order placement
  if (s.includes('select ci.product_id, ci.quantity, p.price, p.vendor_id from cart_items ci')) {
    const customerId = params[0];
    const cart = carts.find(c => c.customer_id === customerId);
    if (!cart) return [[]];
    const items = cartItems.filter(ci => ci.cart_id === cart.id).map(ci => {
      const p = products.find(prod => prod.id === ci.product_id) || {};
      return {
        product_id: ci.product_id,
        quantity: ci.quantity,
        price: p.price || 0,
        vendor_id: p.vendor_id || 2
      };
    });
    return [items];
  }

  // 13. Create Order
  if (s.startsWith('insert into orders')) {
    const [customer_id, total_amount, status, payment_status] = params;
    const ord = { id: nextOrderId++, customer_id, total_amount, status: status || 'placed', payment_status: payment_status || 'pending', created_at: new Date() };
    orders.push(ord);
    return [{ insertId: ord.id }];
  }

  // 14. Create Order item
  if (s.startsWith('insert into order_items')) {
    const [order_id, product_id, vendor_id, quantity, unit_price] = params;
    const oi = { id: orderItems.length + 1, order_id, product_id, vendor_id, quantity, unit_price };
    orderItems.push(oi);
    return [{ insertId: oi.id }];
  }

  // 15. Clear Cart on order
  if (s.includes('delete ci from cart_items ci join carts c on c.id=ci.cart_id where c.customer_id=?')) {
    const customerId = params[0];
    const cart = carts.find(c => c.customer_id === customerId);
    if (cart) {
      for (let i = cartItems.length - 1; i >= 0; i--) {
        if (cartItems[i].cart_id === cart.id) cartItems.splice(i, 1);
      }
    }
    return [{ affectedRows: 1 }];
  }

  // 16. Decrement product stock
  if (s.includes('update products set stock=stock-?')) {
    const [qty, prodId] = params;
    const p = products.find(x => x.id === Number(prodId));
    if (p) p.stock = Math.max(0, p.stock - qty);
    return [{ affectedRows: 1 }];
  }

  // 17. Customer Orders
  if (s.includes('select * from orders where customer_id')) {
    const customerId = params[0];
    const ords = orders.filter(o => o.customer_id === customerId).sort((a,b) => b.id - a.id);
    return [ords];
  }

  // 18. Vendor Orders
  if (s.includes('from orders o join order_items oi on oi.order_id=o.id join users u on u.id=o.customer_id where oi.vendor_id=?')) {
    const vendorId = params[0];
    const ords = orders.map(o => {
      const u = users.find(x => x.id === o.customer_id);
      return {
        ...o,
        customer_name: u ? u.name : 'Customer'
      };
    }).sort((a,b) => b.id - a.id);
    return [ords];
  }

  // 19. Update Order Status
  if (s.includes('update orders o join order_items oi on oi.order_id=o.id set o.status=?')) {
    const [status, orderId] = params;
    const ord = orders.find(o => o.id === Number(orderId));
    if (ord) ord.status = status;
    return [{ affectedRows: ord ? 1 : 0 }];
  }

  // 20. Payments
  if (s.includes('select * from orders where id=? and customer_id=?')) {
    const [orderId, customerId] = params;
    const ord = orders.find(o => o.id === Number(orderId) && o.customer_id === customerId);
    return [ord ? [ord] : []];
  }

  if (s.startsWith('insert into payments')) {
    const [order_id, amount, method, transaction_id, status] = params;
    const pay = { id: nextPaymentId++, order_id, amount, method, transaction_id, status };
    payments.push(pay);
    return [{ insertId: pay.id }];
  }

  if (s.includes("update orders set payment_status='paid'")) {
    const [orderId] = params;
    const ord = orders.find(o => o.id === Number(orderId));
    if (ord) ord.payment_status = 'paid';
    return [{ affectedRows: ord ? 1 : 0 }];
  }

  // 21. Vendor Dashboard Stats
  if (s.includes('select coalesce(sum(oi.quantity*oi.unit_price),0) sales')) {
    const totalSales = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + Number(o.total_amount), 0);
    return [[{ sales: totalSales, orders: orders.length, products: products.filter(p => p.is_active).length }]];
  }

  // 22. Admin Stats
  if (s.includes('select count(*) count from users')) {
    return [[{ count: users.length }]];
  }
  if (s.includes('select count(*) count from products where is_active=1')) {
    return [[{ count: products.filter(p => p.is_active).length }]];
  }
  if (s.includes('select count(*) count from orders')) {
    return [[{ count: orders.length }]];
  }
  if (s.includes("from orders where payment_status='paid'")) {
    const rev = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + Number(o.total_amount), 0);
    return [[{ total: rev }]];
  }

  // 23. Admin Pending Vendors
  if (s.includes("from users where role='vendor' and vendor_status='pending'")) {
    const pending = users.filter(u => u.role === 'vendor' && u.vendor_status === 'pending');
    return [pending];
  }

  // 24. Admin Approve Vendor
  if (s.includes("update users set vendor_status='approved'")) {
    const [id] = params;
    const u = users.find(x => x.id === Number(id));
    if (u) u.vendor_status = 'approved';
    return [{ affectedRows: u ? 1 : 0 }];
  }

  // Default fallback
  return [[]];
}

module.exports = { query };

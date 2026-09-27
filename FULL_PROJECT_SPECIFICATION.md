# softmulti_pro — Complete Full-Stack Master Specification (Frontend & Backend)

## 1. Project High-Level Architecture

`softmulti_pro` is a robust multi-vendor digital e-commerce web platform engineered with a decoupled client-server architecture:
- **Frontend**: Responsive Single-Origin Web App (HTML5, Vanilla CSS Design System with Glassmorphism, Vanilla JS with Fetch API & JWT). Running on `http://127.0.0.1:5500`.
- **Backend**: Node.js + Express REST API server with JWT Bearer Authentication and RBAC (Role-Based Access Control). Running on `http://localhost:5000`.
- **Database**: MySQL relational database (`softmulti_pro`) with foreign keys, transactional integrity, and cascaded constraints. Running on `localhost:3306`.

```
                                  ┌────────────────────────────────┐
                                  │   Browser Client (Port 5500)   │
                                  │   HTML5 / Modern CSS / ES6 JS  │
                                  └───────────────┬────────────────┘
                                                  │ HTTP / JSON (JWT Bearer)
                                                  ▼
                                  ┌────────────────────────────────┐
                                  │   Express API (Port 5000)      │
                                  │   Controllers, JWT Middleware  │
                                  └───────────────┬────────────────┘
                                                  │ MySQL2 Connection Pool
                                                  ▼
                                  ┌────────────────────────────────┐
                                  │   MySQL Database (Port 3306)   │
                                  │   Database: softmulti_pro      │
                                  └────────────────────────────────┘
```

---

## 2. Relational Database Schema (`database/schema.sql`)

### 1. `users` Table
Stores user accounts for Customers, Vendors, and Administrators.
- `id` (INT, PK, AUTO_INCREMENT)
- `name` (VARCHAR(100), NOT NULL)
- `email` (VARCHAR(150), UNIQUE, NOT NULL)
- `password_hash` (VARCHAR(255), NOT NULL) — Encrypted with bcryptjs
- `role` (ENUM('admin', 'vendor', 'customer'), DEFAULT 'customer')
- `vendor_status` (ENUM('pending', 'approved', 'rejected'), DEFAULT 'approved' for customer/admin, 'pending' for newly registered vendors)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### 2. `categories` Table
- `id` (INT, PK, AUTO_INCREMENT)
- `name` (VARCHAR(100), NOT NULL)
- `slug` (VARCHAR(100), UNIQUE, NOT NULL)
- Seeded categories: `agriculture`, `crafts`, `books`, `pharmacy`, `other`.

### 3. `products` Table
- `id` (INT, PK, AUTO_INCREMENT)
- `vendor_id` (INT, FK -> users.id)
- `category_id` (INT, FK -> categories.id)
- `name` (VARCHAR(180), NOT NULL)
- `description` (TEXT)
- `price` (DECIMAL(10,2), NOT NULL)
- `stock` (INT, DEFAULT 0)
- `image_url` (VARCHAR(500))
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at` (TIMESTAMP)

### 4. `carts` & `cart_items` Tables
- `carts`: `id` (PK), `customer_id` (FK -> users.id, UNIQUE).
- `cart_items`: `id` (PK), `cart_id` (FK), `product_id` (FK), `quantity` (INT, DEFAULT 1), UNIQUE KEY `uq_cart_product(cart_id, product_id)`.

### 5. `orders` & `order_items` Tables
- `orders`: `id` (PK), `customer_id` (FK -> users.id), `total_amount` (DECIMAL(10,2)), `status` (ENUM('placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')), `payment_status` (ENUM('pending', 'paid', 'failed', 'refunded')), `created_at`.
- `order_items`: `id` (PK), `order_id` (FK), `product_id` (FK), `vendor_id` (FK), `quantity` (INT), `unit_price` (DECIMAL(10,2)).

### 6. `payments` Table
- `id` (PK), `order_id` (FK -> orders.id), `amount` (DECIMAL(10,2)), `method` (VARCHAR(50)), `transaction_id` (VARCHAR(100), UNIQUE), `status` (ENUM('paid', 'failed', 'refunded')), `created_at`.

### 7. `reviews` Table
- `id` (PK), `product_id` (FK), `customer_id` (FK), `rating` (INT 1-5), `comment` (TEXT), `created_at`.

---

## 3. Backend REST API Specification (`backend/`)

Base URL: `http://localhost:5000/api`

### 1. Health Endpoint
- `GET /api/health`
  - Response: `{ "success": true, "message": "softmulti_pro API is running" }`

### 2. Authentication (`/api/auth`)
- `POST /api/auth/register`
  - Body: `{ "name", "email", "password", "role": "customer"|"vendor" }`
  - Response: `{ "success": true, "message": "...", "userId": 123 }`
- `POST /api/auth/login`
  - Body: `{ "email", "password" }`
  - Logic: Validates bcrypt password, checks if vendor is approved, issues signed JWT.
  - Response: `{ "success": true, "token": "<jwt>", "user": { "id", "name", "email", "role" } }`

### 3. Product Catalog (`/api/products`)
- `GET /api/products` (Public)
  - Query: `?category=agriculture&search=honey`
  - Returns active products joined with vendor name and category name.
- `POST /api/products` (Vendor only)
  - Body: `{ "name", "description", "price", "stock", "category_id", "image_url" }`
  - Creates a product tied to `req.user.id`.
- `PUT /api/products/:id` (Vendor only)
  - Updates title, description, price, stock, or image.
- `DELETE /api/products/:id` (Vendor only)
  - Soft-deletes product by setting `is_active = 0`.

### 4. Shopping Cart (`/api/cart`)
- `GET /api/cart` (Customer only)
  - Returns all items in the customer's cart with quantities, prices, and photos.
- `POST /api/cart` (Customer only)
  - Body: `{ "product_id": 1, "quantity": 1 }`
  - Upserts item in customer cart.
- `PUT /api/cart/:id` (Customer only)
  - Body: `{ "quantity": 3 }`
  - Updates line item quantity.
- `DELETE /api/cart/:id` (Customer only)
  - Removes item from cart.

### 5. Orders & Dispatch Lifecycle (`/api/orders`)
- `POST /api/orders` (Customer only)
  - Uses an ACID SQL transaction: Reads cart items, calculates total, creates `orders` record, inserts individual `order_items` tagged with vendor IDs, decrements product stock, and clears the cart.
  - Returns: `{ "success": true, "orderId": 5, "total": 1200.00 }`
- `GET /api/orders/customer` (Customer only)
  - Returns customer's historical orders with statuses and payment flags.
- `GET /api/orders/vendor` (Vendor only)
  - Returns orders that contain products belonging to the logged-in vendor.
- `PUT /api/orders/:id/status` (Vendor only)
  - Body: `{ "status": "confirmed"|"packed"|"shipped"|"delivered"|"cancelled" }`
  - Updates order fulfillment progress.

### 6. Payments (`/api/payments`)
- `POST /api/payments/pay` (Customer only)
  - Body: `{ "order_id": 5, "method": "card-demo"|"upi-demo"|"cod" }`
  - Records payment transaction and flips order `payment_status` to `'paid'`.

### 7. Vendor Hub (`/api/vendors`)
- `GET /api/vendors/dashboard` (Vendor only)
  - Computes vendor-specific realized sales revenue, distinct order count, and active product count.

### 8. Administrator Governance (`/api/admin`)
- `GET /api/admin/stats` (Admin only)
  - Returns system-wide metrics: Total registered users, total active products, total orders, and paid platform revenue.
- `GET /api/admin/vendors/pending` (Admin only)
  - Returns list of vendor accounts awaiting verification.
- `PUT /api/admin/vendors/:id/approve` (Admin only)
  - Approves a vendor account, granting access to log in and list products.

---

## 4. Frontend Architecture & Design Specification (`frontend/`)

### 1. Modern Design Tokens (`assets/css/style.css`)
- **Theme**: Luxury deep slate mesh (`#0a0d14`, `#0f1422`) with radial glow overlays.
- **Glassmorphism**: Translucent cards (`rgba(19, 26, 42, 0.75)`, `backdrop-filter: blur(16px)`).
- **Typography**: `Outfit` for bold modern headers + `Plus Jakarta Sans` for clean UI body.
- **Interactive Micro-animations**: Elevation on hover, glowing borders (`rgba(99, 102, 241, 0.4)`), scale transitions.
- **Status Pills**: Color-coded badges for Placed (amber), Confirmed (indigo), Packed (blue), Shipped (cyan), Delivered (emerald), and Cancelled (rose).
- **Notifications**: Floating animated toast system replacing generic browser alerts.

### 2. Client Scripts (`assets/js/`)
- `api.js`: Universal fetch wrapper with auto JWT Bearer injection, session persistence, toast engine, and automatic navbar user/cart synchronizer.
- `auth.js`: Login and registration handlers with 1-click Demo Fill buttons (`Customer`, `Vendor`, `Admin`) and smart role redirects.
- `products.js`: Dynamic product rendering, debounced keyword search, category filter pills, price sorting, and cart adding.
- `cart.js`: Live cart manager with quantity steppers (`-` / `+`), item deletion, subtotal/shipping/tax calculators, and checkout transition.
- `dashboard.js`: Customer order history, Vendor sales KPI cards & dispatch status dropdowns, Admin approval queue, and visual milestone order tracking stepper.

### 3. Page Catalog & Functionality
1. `index.html`: Showcase landing page with animated hero, category cards (Farmers, Artisans, Bookshops, Pharmacies), live featured product grid, and trust assurances.
2. `products.html`: Full marketplace catalog with category filter chips, search input, sort selector, and stock status indicators.
3. `login.html`: Glassmorphic auth card featuring 1-click demo filler buttons for instant testing.
4. `register.html`: User onboarding with role selector (`Customer` vs `Vendor`) and automated vendor verification notices.
5. `cart.html`: Comprehensive shopping cart with quantity modifications, price breakdowns, and checkout button.
6. `payment.html`: Multi-step checkout with delivery address form and simulated payment methods (Card, UPI, Net Banking, COD).
7. `order-tracking.html`: Visual order timeline stepper (`Placed` → `Confirmed` → `Packed` → `Shipped` → `Delivered`) with order switch dropdown.
8. `customer-dashboard.html`: Customer profile overview, spend totals, active order counters, and order tracking links.
9. `vendor-dashboard.html`: Vendor sales analytics, order fulfillment queue, and real-time status dispatch dropdown.
10. `vendor-products.html`: Vendor inventory manager with stock status indicators, product removal, and "Add New Product" modal form.
11. `admin-dashboard.html`: System-wide KPI cards and pending vendor approval queue with 1-click authorization.

---

## 5. Quick Verification & Demo Accounts

### Running Ports
- **Frontend**: `http://127.0.0.1:5500/frontend/index.html`
- **Backend API**: `http://localhost:5000/api/health`
- **MySQL Database**: Port `3306`, DB: `softmulti_pro`, User: `root`, Password: `root`

### Ready-To-Test Credentials
- **Customer**: `customer@softmulti.local` / `Customer@123`
- **Vendor**: `vendor@softmulti.local` / `Vendor@123`
- **Admin**: `admin@softmulti.local` / `Admin@123`

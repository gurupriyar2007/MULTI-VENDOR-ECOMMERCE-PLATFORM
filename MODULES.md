# softmulti_pro Module Mapping

| SRS Module | Frontend | Backend |
|---|---|---|
| Vendor Management | vendor-dashboard.html, vendor-products.html | vendorRoutes, productRoutes |
| Customer Management | register.html, login.html, customer-dashboard.html | authRoutes |
| Product Management | products.html, vendor-products.html | productRoutes |
| Shopping Cart | cart.html | cartRoutes |
| Order Management | customer-dashboard.html, order-tracking.html, vendor-dashboard.html | orderRoutes |
| Payment System | payment.html | paymentRoutes |
| Reviews & Ratings | API-ready | reviewRoutes |
| Admin Management | admin-dashboard.html | adminRoutes |
| Authentication | login/register | authController + JWT middleware |
| Inventory | vendor product management | products stock + order decrement |
| Delivery Tracking | order-tracking.html | order status API |
| Email/SMS | integration placeholders | can be connected via service provider |

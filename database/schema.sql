CREATE DATABASE IF NOT EXISTS softmulti_pro;
USE softmulti_pro;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','vendor','customer') NOT NULL DEFAULT 'customer',
  vendor_status ENUM('pending','approved','rejected') DEFAULT 'approved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  category_id INT NOT NULL,
  name VARCHAR(180) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_cart_product(cart_id, product_id),
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('placed','confirmed','packed','shipped','delivered','cancelled') DEFAULT 'placed',
  payment_status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id)
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  vendor_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (vendor_id) REFERENCES users(id)
);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('paid','failed','refunded') DEFAULT 'paid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  customer_id INT NOT NULL,
  rating INT NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review(product_id,customer_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO categories(name,slug) VALUES
('Agriculture','agriculture'),('Handmade Crafts','crafts'),('Books','books'),('Pharmacy','pharmacy'),('Other','other');

-- Demo password hashes generated with bcryptjs for the passwords in README.
INSERT INTO users(name,email,password_hash,role,vendor_status) VALUES
('System Admin','admin@softmulti.local','$2a$10$7aYv8vVJrJfZ7Vj6nqH1Uu1g6GQm3JYVYqQ8Xy9WzJm8t9lJr7F6a','admin','approved'),
('Demo Vendor','vendor@softmulti.local','$2a$10$7aYv8vVJrJfZ7Vj6nqH1Uu1g6GQm3JYVYqQ8Xy9WzJm8t9lJr7F6a','vendor','approved'),
('Demo Customer','customer@softmulti.local','$2a$10$7aYv8vVJrJfZ7Vj6nqH1Uu1g6GQm3JYVYqQ8Xy9WzJm8t9lJr7F6a','customer','approved');

-- For a clean setup, register fresh users from the UI if the demo hashes do not match your bcrypt version.
INSERT INTO products(vendor_id,category_id,name,description,price,stock,image_url) VALUES
(2,1,'Fresh Farm Vegetables','Fresh vegetables supplied by local farmers.',120.00,50,'https://images.unsplash.com/photo-1540420773420-3366772f4999'),
(2,2,'Handmade Craft Basket','Eco-friendly handmade basket.',450.00,20,'https://images.unsplash.com/photo-1529958030586-3aae4ca485ff'),
(2,3,'Programming Fundamentals','Beginner-friendly programming book.',599.00,15,'https://images.unsplash.com/photo-1544947950-fa07a98d237f'),
(2,4,'Wellness Essentials','General wellness products from an approved seller.',299.00,25,'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae');

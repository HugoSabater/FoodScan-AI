-- Initialize Database
DROP TABLE IF EXISTS scans;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

CREATE DATABASE IF NOT EXISTS foodscan_db;
USE foodscan_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    allergies JSON DEFAULT NULL,
    dietary_preference ENUM('vegan', 'keto', 'none') NOT NULL DEFAULT 'none',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    brand VARCHAR(255),
    nutri_score VARCHAR(5),
    nova_group INT,
    image_url TEXT,
    eco_score VARCHAR(5),
    ingredients_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Scans/History Table
CREATE TABLE IF NOT EXISTS scans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    product_code VARCHAR(50),
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_code) REFERENCES products(code)
);

-- Insert Mock Data
INSERT IGNORE INTO users (id, name, email, password_hash) VALUES 
(1, 'Demo User', 'demo@foodscan.ai', '$2b$10$EpOuccqG/7.0a8Z3N8.8..');

INSERT IGNORE INTO products (code, name, brand, nutri_score, nova_group, eco_score) VALUES
('3017620422003', 'Nutella', 'Ferrero', 'e', 4, 'e'),
('5449000000996', 'Coca-Cola', 'Coca-Cola', 'e', 4, 'e');

INSERT IGNORE INTO scans (user_id, product_code) VALUES
(1, '3017620422003'),
(1, '5449000000996');

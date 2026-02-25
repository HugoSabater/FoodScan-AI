-- ============================================
-- FoodScan AI - Database Initialization
-- ============================================

CREATE DATABASE IF NOT EXISTS foodscan_db;
USE foodscan_db;

-- ── Drop existing tables (clean start) ────────
DROP TABLE IF EXISTS scans;
DROP TABLE IF EXISTS analysis_results;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- ── Users Table ──────────────────────────────
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    allergies JSON DEFAULT NULL,
    dietary_preference ENUM('vegan', 'keto', 'none') NOT NULL DEFAULT 'none',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Products Table ───────────────────────────
CREATE TABLE products (
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

-- ── Shared Analysis Cache ────────────────────
CREATE TABLE analysis_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(50) NOT NULL,
    diet VARCHAR(50) NOT NULL,
    allergies VARCHAR(255) NOT NULL DEFAULT 'none',
    health_score INT NOT NULL,
    is_suitable BOOLEAN NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_analysis (product_code, diet, allergies)
);

-- ── Scans (History) Table ───────────────────
CREATE TABLE scans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    profile_hash VARCHAR(64),
    analysis_result JSON,
    analysis_source ENUM('ai', 'cache', 'fallback'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE
);

-- ── Demo Data ────────────────────────────────
-- Passwords are hashed versions of 'admin1234', 'vegan1234', 'hugo1234'
INSERT INTO users (id, name, email, password_hash, dietary_preference, allergies) VALUES 
(1, 'Admin Demo', 'admin@foodscan.ai', '$2b$10$EpOuccqG/7.0a8Z3N8.8..', 'none', '[]'),
(2, 'Usuario Vegano Demo', 'vegan@foodscan.ai', '$2b$10$EpOuccqG/7.0a8Z3N8.8..', 'vegan', '[]'),
(3, 'Hugo Sabater Gavarrell', 'hugo@foodscan.ai', '$2b$10$EpOuccqG/7.0a8Z3N8.8..', 'keto', '["gluten"]');

INSERT INTO products (code, name, brand, nutri_score, nova_group, eco_score) VALUES
('3017620422003', 'Nutella', 'Ferrero', 'e', 4, 'e'),
('5449000000996', 'Coca-Cola Oral', 'Coca-Cola', 'e', 4, 'e'),
('8410014478764', 'ColaCao Original', 'Idilia Foods', 'd', 4, 'd');

INSERT INTO scans (user_id, product_code, analysis_source) VALUES
(1, '3017620422003', 'ai'),
(3, '5449000000996', 'ai');

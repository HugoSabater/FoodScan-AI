/**
 * Models Index
 * Export all Sequelize models and configure associations
 */

const { sequelize } = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Scan = require('./Scan');

// =====================================
// ASSOCIATIONS
// =====================================

// User has many Scans
User.hasMany(Scan, {
  foreignKey: 'user_id',
  as: 'scans',
  onDelete: 'CASCADE',
});

// Product has many Scans
Product.hasMany(Scan, {
  foreignKey: 'product_code',
  sourceKey: 'barcode',
  as: 'scans',
  onDelete: 'CASCADE',
});

// Scan belongs to User
Scan.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Scan belongs to Product
Scan.belongsTo(Product, {
  foreignKey: 'product_code',
  targetKey: 'barcode',
  as: 'product',
});

// =====================================
// DATABASE SYNC
// =====================================

/**
 * Sync all models with the database
 * Use { alter: true } in development to update schema
 * Use { force: true } only for complete reset (DESTROYS DATA)
 */
const syncDatabase = async (options = { alter: true }) => {
  try {
    await sequelize.sync(options);
    console.info('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Product,
  Scan,
  syncDatabase,
};

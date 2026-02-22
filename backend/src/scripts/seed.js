/**
 * Database Seed Script
 * Populates the database with demo data for development/testing
 *
 * Usage: npm run seed
 */

require('dotenv').config();

const { sequelize, User, Product } = require('../models');

// =====================================
// DEMO USERS
// =====================================

const demoUsers = [
  {
    name: 'Hugo Sabater Gavarrell',
    email: 'hugo@foodscan.ai',
    password: 'hugo1234',
    allergies: ['gluten'],
    dietary_preference: 'keto',
  },
  {
    name: 'Usuario Vegano Demo',
    email: 'vegan@foodscan.ai',
    password: 'vegan1234',
    allergies: [],
    dietary_preference: 'vegan',
  },
  {
    name: 'Admin Demo',
    email: 'admin@foodscan.ai',
    password: 'admin1234',
    allergies: [],
    dietary_preference: 'none',
  },
];

// =====================================
// REAL PRODUCTS DATA
// =====================================

const demoProducts = [
  {
    barcode: '5449000000996',
    name: 'Coca-Cola Original',
    brand: 'Coca-Cola',
    ingredients_text:
      'Agua carbonatada, azúcar, colorante (E-150d), acidulante (ácido fosfórico), aromas.',
    nutri_score: 'e',
    image_url: 'assets/products/5449000000996.jpg',
  },
  {
    barcode: '8410014478764',
    name: 'ColaCao Original',
    brand: 'Idilia Foods',
    ingredients_text:
      'Azúcar, cacao natural 22%, crema de cereal kola-malteado, extracto de malta, sales minerales, aromas.',
    nutri_score: 'd',
    image_url: 'assets/products/8410014478764.jpg',
  },
  {
    barcode: '7613034626844',
    name: 'KitKat',
    brand: 'Nestlé',
    ingredients_text:
      'Azúcar, harina de trigo, manteca de cacao, leche desnatada, pasta de cacao, grasa de palma.',
    nutri_score: 'e',
    image_url: 'assets/products/7613034626844.jpg',
  },
  {
    barcode: '80135463',
    name: 'Nutella',
    brand: 'Ferrero',
    ingredients_text:
      'Azúcar, aceite de palma, avellanas, cacao desgrasado, leche desnatada en polvo, lecitinas.',
    nutri_score: 'e',
    image_url: 'assets/products/80135463.jpg',
  },
];

// =====================================
// SEED FUNCTION
// =====================================

const seed = async () => {
  try {
    console.info('\n🌱 Starting database seeding...\n');

    // Force sync - DESTROYS ALL DATA
    console.info('🗑️  Dropping and recreating all tables...');
    await sequelize.sync({ force: true });
    console.info('✅ Tables recreated successfully.\n');

    // Create Users
    console.info('👤 Creating demo users...');
    const createdUsers = await User.bulkCreate(demoUsers, {
      individualHooks: true, // Important: triggers beforeCreate hook for password hashing
    });
    console.info(`✅ Created ${createdUsers.length} users.\n`);

    // Create Products
    console.info('📦 Creating demo products...');
    const createdProducts = await Product.bulkCreate(demoProducts);
    console.info(`✅ Created ${createdProducts.length} products.\n`);

    // Create Demo Scans (guarantee at least 5 for user 1 - Hugo)
    console.info('📷 Creating demo scans...');
    const now = new Date();

    // Use codes from demoProducts directly (they are the PK values we inserted)
    const productCodes = demoProducts.map(p => p.barcode);
    const userIds = createdUsers.map(u => u.id);

    const scanValues = [];
    for (let i = 0; i < 10; i++) {
      const userId = i < 5 ? userIds[0] : userIds[Math.floor(Math.random() * userIds.length)];
      const code = productCodes[Math.floor(Math.random() * productCodes.length)];
      const dt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');
      scanValues.push(`(${userId}, '${code}', '${dt}', '${dt}', '${dt}')`);
    }

    await sequelize.query(
      `INSERT INTO scans (user_id, product_code, scanned_at, created_at, updated_at) VALUES ${scanValues.join(', ')}`
    );
    const createdScans = { length: scanValues.length };
    console.info(`✅ Created ${createdScans.length} scans.\n`);

    // Summary
    console.info('='.repeat(50));
    console.info('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.info('='.repeat(50));
    console.info('\n📊 Summary:');
    console.info(`   • Users: ${createdUsers.length}`);
    console.info(`   • Products: ${createdProducts.length}`);
    console.info(`   • Scans: ${createdScans.length}`);
    console.info('\n👤 Demo Accounts:');
    demoUsers.forEach(user => {
      console.info(`   • ${user.name} <${user.email}>`);
    });
    console.info('\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    // Close database connection
    await sequelize.close();
    console.info('🔌 Database connection closed.\n');
  }
};

// Run seed
seed()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });

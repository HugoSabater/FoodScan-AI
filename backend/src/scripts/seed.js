/**
 * Database Seed Script
 * Populates the database with demo data for development/testing
 *
 * Usage: npm run seed
 */

require('dotenv').config();

const { sequelize, User, Product, Scan } = require('../models');

// =====================================
// DEMO USERS
// =====================================

const demoUsers = [
  {
    username: 'admin',
    email: 'admin@foodscan.com',
    password: 'admin123',
    allergies: [],
    dietary_preference: 'none',
  },
  {
    username: 'veganuser',
    email: 'vegan@foodscan.com',
    password: 'vegan123',
    allergies: [],
    dietary_preference: 'vegan',
  },
  {
    username: 'allergyuser',
    email: 'allergy@foodscan.com',
    password: 'allergy123',
    allergies: ['nuts', 'gluten'],
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
      'Agua carbonatada, azúcar, colorante (E-150d), acidulante (ácido fosfórico), aromas naturales (incluyendo cafeína).',
    nutri_score: 'e',
    image_url:
      'https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.426.400.jpg',
  },
  {
    barcode: '8410376010107',
    name: 'Copos de Avena Integral',
    brand: 'Quaker',
    ingredients_text: 'Copos de avena integral 100%.',
    nutri_score: 'a',
    image_url:
      'https://images.openfoodfacts.org/images/products/841/037/601/0107/front_es.38.400.jpg',
  },
  {
    barcode: '8480000591234',
    name: 'Hummus Clásico',
    brand: 'Mercadona',
    ingredients_text:
      'Garbanzos (58%), agua, pasta de sésamo (tahini) (9%), aceite de girasol, zumo de limón, sal, ajo, comino.',
    nutri_score: 'b',
    image_url:
      'https://images.openfoodfacts.org/images/products/848/000/059/1234/front_es.10.400.jpg',
  },
  {
    barcode: '7622210449283',
    name: 'Oreo Original',
    brand: 'Oreo',
    ingredients_text:
      'Harina de trigo, azúcar, aceite de palma, cacao desgrasado en polvo (4.6%), almidón de trigo, jarabe de glucosa-fructosa, gasificantes, sal, emulgentes, aroma.',
    nutri_score: 'e',
    image_url:
      'https://images.openfoodfacts.org/images/products/762/221/044/9283/front_en.299.400.jpg',
  },
  {
    barcode: '8480000108326',
    name: 'Yogur Natural',
    brand: 'Hacendado',
    ingredients_text: 'Leche pasteurizada, fermentos lácticos.',
    nutri_score: 'a',
    image_url:
      'https://images.openfoodfacts.org/images/products/848/000/010/8326/front_es.58.400.jpg',
  },
  {
    barcode: '80135463',
    name: 'Nutella',
    brand: 'Ferrero',
    ingredients_text:
      'Azúcar, aceite de palma, avellanas (13%), cacao desgrasado (7.4%), leche desnatada en polvo (6.6%), suero de leche en polvo, emulgentes: lecitinas (soja), vainillina.',
    nutri_score: 'e',
    image_url:
      'https://images.openfoodfacts.org/images/products/000/080/135/463/front_en.88.400.jpg',
  },
  {
    barcode: '8480000210470',
    name: 'Pan de Molde Integral',
    brand: 'Hacendado',
    ingredients_text:
      'Harina integral de trigo (52%), agua, levadura, aceite de girasol, sal, gluten de trigo, vinagre de vino.',
    nutri_score: 'b',
    image_url:
      'https://images.openfoodfacts.org/images/products/848/000/021/0470/front_es.81.400.jpg',
  },
  {
    barcode: '8437008180014',
    name: 'Agua Mineral Natural',
    brand: 'Bezoya',
    ingredients_text: 'Agua mineral natural.',
    nutri_score: 'a',
    image_url:
      'https://images.openfoodfacts.org/images/products/843/700/818/0014/front_es.42.400.jpg',
  },
  {
    barcode: '8410127044101',
    name: 'Aceite de Oliva Virgen Extra',
    brand: 'Carbonell',
    ingredients_text: 'Aceite de oliva virgen extra.',
    nutri_score: 'c',
    image_url:
      'https://images.openfoodfacts.org/images/products/841/012/704/4101/front_es.78.400.jpg',
  },
  {
    barcode: '7613034626844',
    name: 'KitKat',
    brand: 'Nestlé',
    ingredients_text:
      'Azúcar, harina de trigo, manteca de cacao, leche desnatada en polvo, pasta de cacao, grasa de palma, grasa láctea, emulgente (lecitina de soja), levadura, sal, aroma.',
    nutri_score: 'e',
    image_url:
      'https://images.openfoodfacts.org/images/products/761/303/462/6844/front_en.168.400.jpg',
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

    // Create Random Scans
    console.info('📷 Creating demo scans...');
    const scans = [];
    const now = new Date();

    for (let i = 0; i < 5; i++) {
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const randomProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)];

      // Random date within the last 7 days
      const randomDate = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);

      scans.push({
        user_id: randomUser.id,
        product_id: randomProduct.id,
        scanned_at: randomDate,
      });
    }

    const createdScans = await Scan.bulkCreate(scans);
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
      console.info(`   • ${user.email} (password: ${user.password})`);
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

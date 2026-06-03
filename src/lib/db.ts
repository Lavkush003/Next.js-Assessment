import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("WARNING: DATABASE_URL is not set. Database queries will fail.");
}

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

let tablesEnsured = false;

async function seedBuyerUser(dbPool: Pool) {
  const buyerCheck = await dbPool.query(
    "SELECT COUNT(*) FROM users WHERE email = 'buyer@aasamedchem.com'"
  );
  if (parseInt(buyerCheck.rows[0].count, 10) === 0) {
    console.log("Seeding demo buyer account...");
    const buyerPasswordHash = bcrypt.hashSync("buyer123", 10);
    await dbPool.query(
      `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)`,
      ['buyer@aasamedchem.com', buyerPasswordHash, 'Procurement Buyer', 'buyer']
    );
  }
}

// Seed helper
async function seedDefaultData(dbPool: Pool) {
  // Check if users already exist
  const userCheck = await dbPool.query("SELECT COUNT(*) FROM users");
  const userCount = parseInt(userCheck.rows[0].count, 10);

  if (userCount === 0) {
    console.log("Seeding default users...");
    const adminPasswordHash = bcrypt.hashSync("admin123", 10);
    const sellerPasswordHash = bcrypt.hashSync("seller123", 10);
    const buyerPasswordHash = bcrypt.hashSync("buyer123", 10);

    await dbPool.query(`
      INSERT INTO users (email, password_hash, name, role) VALUES 
      ('admin@aasamedchem.com', $1, 'System Administrator', 'admin'),
      ('seller@aasamedchem.com', $2, 'Sales Executive', 'seller'),
      ('buyer@aasamedchem.com', $3, 'Procurement Buyer', 'buyer')
    `, [adminPasswordHash, sellerPasswordHash, buyerPasswordHash]);
  } else {
    await seedBuyerUser(dbPool);
  }

  // Check if products already exist
  const productCheck = await dbPool.query("SELECT COUNT(*) FROM products");
  const productCount = parseInt(productCheck.rows[0].count, 10);

  if (productCount === 0) {
    console.log("Seeding sample chemical products...");
    const sampleProducts = [
      {
        sku: 'CHEM-PAR-001',
        name: 'Acetaminophen (Paracetamol) USP',
        description: 'Active Pharmaceutical Ingredient (API) of high purity (99.5%+). White crystalline powder.',
        category: 'Active Ingredients',
        unit_type: 'weight',
        base_unit: 'kg',
        base_price: 450.0000, // ₹450 per kg
        quantity_in_stock: 120.50000000
      },
      {
        sku: 'CHEM-ETH-002',
        name: 'Ethanol Absolute (99.9% HPLC Grade)',
        description: 'Laboratory solvent for analytical chromatography and general chemical synthesis.',
        category: 'Solvents',
        unit_type: 'volume',
        base_unit: 'L',
        base_price: 180.0000, // ₹180 per L
        quantity_in_stock: 850.00000000
      },
      {
        sku: 'CHEM-SACL-003',
        name: 'Sodium Chloride (Analytical Reagent)',
        description: 'Fine grade analytical reagent. Suitable for cell culture applications.',
        category: 'Reagents',
        unit_type: 'weight',
        base_unit: 'g',
        base_price: 0.2500, // ₹0.25 per gram (₹250/kg)
        quantity_in_stock: 25000.00000000 // 25,000 g (25 kg)
      },
      {
        sku: 'CHEM-HCL-004',
        name: 'Hydrochloric Acid 37% (Fuming)',
        description: 'Concentrated strong mineral acid. Highly corrosive. Handled under fume hood.',
        category: 'Reagents',
        unit_type: 'volume',
        base_unit: 'mL',
        base_price: 0.6500, // ₹0.65 per mL (₹650/L)
        quantity_in_stock: 5000.00000000 // 5,000 mL (5 L)
      },
      {
        sku: 'LAB-BEK-005',
        name: 'Borosilicate Glass Beaker 250mL',
        description: 'High thermal resistance laboratory beaker with graduation markings.',
        category: 'Labware',
        unit_type: 'count',
        base_unit: 'items',
        base_price: 95.0000, // ₹95 per beaker
        quantity_in_stock: 75.00000000
      }
    ];

    for (const prod of sampleProducts) {
      await dbPool.query(`
        INSERT INTO products (sku, name, description, category, unit_type, base_unit, base_price, quantity_in_stock)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [prod.sku, prod.name, prod.description, prod.category, prod.unit_type, prod.base_unit, prod.base_price, prod.quantity_in_stock]);
    }
  }
}

export async function ensureTablesExist() {
  if (tablesEnsured) return;
  if (!connectionString) return;

  try {
    // 1. Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'seller', 'buyer')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrate existing DB: expand role constraint to include buyer
    await pool.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    `);
    await pool.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'seller', 'buyer'));
    `);
    
    // 2. Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sku VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        unit_type VARCHAR(50) NOT NULL CHECK (unit_type IN ('weight', 'volume', 'count')),
        base_unit VARCHAR(20) NOT NULL CHECK (base_unit IN ('g', 'kg', 'L', 'mL', 'items')),
        base_price NUMERIC(20, 4) NOT NULL,
        quantity_in_stock NUMERIC(20, 8) NOT NULL DEFAULT 0.00000000,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 3. Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
        total_price NUMERIC(20, 4) NOT NULL DEFAULT 0.0000,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 4. Create order_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        ordered_quantity NUMERIC(20, 8) NOT NULL,
        ordered_unit VARCHAR(20) NOT NULL,
        base_quantity NUMERIC(20, 8) NOT NULL,
        base_unit VARCHAR(20) NOT NULL,
        unit_price NUMERIC(20, 4) NOT NULL,
        total_price NUMERIC(20, 4) NOT NULL
      );
    `);

    // 5. Create product_requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_name VARCHAR(255) NOT NULL,
        description TEXT,
        requested_quantity NUMERIC(20, 8) NOT NULL,
        requested_unit VARCHAR(20) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'fulfilled', 'rejected')),
        admin_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed defaults
    await seedDefaultData(pool);
    
    tablesEnsured = true;
    console.log("Database tables verified and seeded successfully.");
  } catch (error) {
    console.error("Error ensuring tables exist:", error);
    throw error;
  }
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  await ensureTablesExist();
  const res = await pool.query(text, params);
  return res.rows as T[];
}

export async function getClient() {
  await ensureTablesExist();
  return await pool.connect();
}

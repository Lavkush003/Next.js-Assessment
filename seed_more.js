const fs = require('fs');
const { Pool } = require('@neondatabase/serverless');

const envFile = fs.readFileSync('./.env.local', 'utf8');
let dbUrl = '';
const match = envFile.match(/DATABASE_URL="([^"]+)"/);
if (match) {
  dbUrl = match[1];
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

const products = [
  // Active Ingredients
  { sku: 'API-PAR-001', name: 'Paracetamol (Acetaminophen) USP', description: 'High purity API suitable for pharmaceutical compounding.', category: 'Active Ingredients', unit_type: 'weight', base_unit: 'kg', base_price: 800, quantity_in_stock: 500 },
  { sku: 'API-IBU-002', name: 'Ibuprofen USP', description: 'High purity API for NSAID formulations.', category: 'Active Ingredients', unit_type: 'weight', base_unit: 'kg', base_price: 1200, quantity_in_stock: 500 },
  { sku: 'API-MET-003', name: 'Metformin Hydrochloride', description: 'High purity API for anti-diabetic formulations.', category: 'Active Ingredients', unit_type: 'weight', base_unit: 'kg', base_price: 950, quantity_in_stock: 500 },
  { sku: 'API-AZI-004', name: 'Azithromycin Dihydrate', description: 'Macrolide antibiotic API.', category: 'Active Ingredients', unit_type: 'weight', base_unit: 'kg', base_price: 3500, quantity_in_stock: 500 },
  { sku: 'API-AMO-005', name: 'Amoxicillin Trihydrate', description: 'Penicillin-class antibacterial API.', category: 'Active Ingredients', unit_type: 'weight', base_unit: 'kg', base_price: 2100, quantity_in_stock: 500 },
  
  // Labware
  { sku: 'LAB-BEA-001', name: 'Borosilicate Glass Beaker (250 mL)', description: 'High quality borosilicate glass beaker for laboratory use.', category: 'Labware', unit_type: 'count', base_unit: 'items', base_price: 150, quantity_in_stock: 1000 },
  { sku: 'LAB-CON-002', name: 'Conical Flask (Erlenmeyer Flask 500 mL)', description: 'Borosilicate glass conical flask.', category: 'Labware', unit_type: 'count', base_unit: 'items', base_price: 250, quantity_in_stock: 800 },
  { sku: 'LAB-TES-003', name: 'Test Tube Set (Pack of 50)', description: 'Set of 50 clear glass test tubes.', category: 'Labware', unit_type: 'count', base_unit: 'items', base_price: 300, quantity_in_stock: 200 },
  { sku: 'LAB-PIP-004', name: 'Pipette (10 mL Graduated)', description: 'Graduated glass measuring pipette.', category: 'Labware', unit_type: 'count', base_unit: 'items', base_price: 120, quantity_in_stock: 500 },
  { sku: 'LAB-STI-005', name: 'Glass Stirring Rod', description: 'Solid glass stirring rod for mixing chemicals.', category: 'Labware', unit_type: 'count', base_unit: 'items', base_price: 40, quantity_in_stock: 2000 },
  
  // Solvents
  { sku: 'SOL-ETH-001', name: 'Ethanol Absolute (99.9%)', description: 'High purity absolute ethanol.', category: 'Solvents', unit_type: 'volume', base_unit: 'L', base_price: 500, quantity_in_stock: 1000 },
  { sku: 'SOL-MET-002', name: 'Methanol (Analytical Grade)', description: 'Analytical grade methanol for lab use.', category: 'Solvents', unit_type: 'volume', base_unit: 'L', base_price: 350, quantity_in_stock: 1000 },
  { sku: 'SOL-ISO-003', name: 'Isopropyl Alcohol (IPA)', description: 'High purity isopropyl alcohol.', category: 'Solvents', unit_type: 'volume', base_unit: 'L', base_price: 400, quantity_in_stock: 1000 }
];

async function seed() {
  for (const p of products) {
    try {
      await pool.query(
        `INSERT INTO products (sku, name, description, category, unit_type, base_unit, base_price, quantity_in_stock)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (sku) DO NOTHING`,
        [p.sku, p.name, p.description, p.category, p.unit_type, p.base_unit, p.base_price, p.quantity_in_stock]
      );
      console.log('Inserted: ' + p.name);
    } catch (e) {
      console.error('Error inserting ' + p.name, e);
    }
  }
  await pool.end();
  console.log('Done!');
}

seed();

// Seed script to add sample pharmaceutical products to the database
// Run with: npx ts-node ./scripts/seedProducts.ts (ensure ts-node is installed)
import { query } from '@/lib/db';

interface Product {
  sku: string;
  name: string;
  description: string;
  category: string;
  unit_type: 'weight' | 'volume' | 'count';
  base_unit: string;
  base_price: number;
  quantity_in_stock: number;
}

const products: Product[] = [
  // APIs
  {
    sku: 'API-PARA-001',
    name: 'Paracetamol (Acetaminophen)',
    description: 'Common analgesic and antipyretic.',
    category: 'APIs',
    unit_type: 'weight',
    base_unit: 'g',
    base_price: 0.05,
    quantity_in_stock: 50000,
  },
  {
    sku: 'API-IBU-002',
    name: 'Ibuprofen',
    description: 'Non‑steroidal anti‑inflammatory drug.',
    category: 'APIs',
    unit_type: 'weight',
    base_unit: 'g',
    base_price: 0.07,
    quantity_in_stock: 40000,
  },
  {
    sku: 'API-ASP-003',
    name: 'Aspirin (Acetylsalicylic Acid)',
    description: 'Pain reliever and anti‑platelet.',
    category: 'APIs',
    unit_type: 'weight',
    base_unit: 'g',
    base_price: 0.06,
    quantity_in_stock: 45000,
  },
  {
    sku: 'API-AMOX-004',
    name: 'Amoxicillin',
    description: 'Broad‑spectrum antibiotic.',
    category: 'APIs',
    unit_type: 'weight',
    base_unit: 'g',
    base_price: 0.09,
    quantity_in_stock: 30000,
  },
  {
    sku: 'API-AZI-005',
    name: 'Azithromycin',
    description: 'Macrolide antibiotic.',
    category: 'APIs',
    unit_type: 'weight',
    base_unit: 'g',
    base_price: 0.12,
    quantity_in_stock: 25000,
  },
  {
    sku: 'API-MET-006',
    name: 'Metformin Hydrochloride',
    description: 'First‑line treatment for type 2 diabetes.',
    category: 'APIs',
    unit_type: 'weight',
    base_unit: 'g',
    base_price: 0.04,
    quantity_in_stock: 60000,
  },
  {
    sku: 'API-ATOR-007',
    name: 'Atorvastatin Calcium',
    description: 'Statin for cholesterol management.',
    category: 'APIs',
    unit_type: 'weight',
    base_unit: 'g',
    base_price: 0.08,
    quantity_in_stock: 35000,
  },
  {
    sku: 'API-DICL-008',
    name: 'Diclofenac Sodium',
    description: 'NSAID for pain and inflammation.',
    category: 'APIs',
    unit_type: 'weight',
    base_unit: 'g',
    base_price: 0.07,
    quantity_in_stock: 30000,
  },
  // Advanced / Industry APIs
  {
    sku: 'ADV-OME-009',
    name: 'Omeprazole',
    description: 'Proton pump inhibitor.',
    category: 'Advanced APIs',
    unit_type: 'weight',
    base_unit: 'g',
    base_price: 0.15,
    quantity_in_stock: 20000,
  },
  {
    sku: 'ADV-PAN-010',
    name: 'Pantoprazole Sodium',
    description: 'Acid reflux treatment.',
    category: 'Advanced APIs',
    unit_type: 'weight',
    base_unit: 'g',
    base_price: 0.16,
    quantity_in_stock: 18000,
  },
  {
    sku: 'ADV-LOS-011',
    name: 'Losartan Potassium',
    description: 'Angiotensin II receptor blocker.',
    category: 'Advanced APIs',
    unit_type: 'weight',
    base_unit: 'g',
    base_price: 0.14,
    quantity_in_stock: 22000,
  },
  // Solvents (already in your system style) – added as products for completeness
  {
    sku: 'SOL-METH-012',
    name: 'Methanol',
    description: 'Polar solvent, industrial grade.',
    category: 'Solvents',
    unit_type: 'volume',
    base_unit: 'L',
    base_price: 0.3,
    quantity_in_stock: 5000,
  },
  {
    sku: 'SOL-IPA-013',
    name: 'Isopropyl Alcohol (IPA)',
    description: 'Common cleaning solvent.',
    category: 'Solvents',
    unit_type: 'volume',
    base_unit: 'L',
    base_price: 0.28,
    quantity_in_stock: 6000,
  },
  // Reagents / Chemicals
  {
    sku: 'CHEM-KCL-014',
    name: 'Potassium Chloride (KCl)',
    description: 'Inorganic salt, reagent grade.',
    category: 'Reagents',
    unit_type: 'weight',
    base_unit: 'kg',
    base_price: 0.2,
    quantity_in_stock: 800,
  },
];

async function seed() {
  console.log('Seeding products...');
  for (const p of products) {
    await query(
      `INSERT INTO products (sku, name, description, category, unit_type, base_unit, base_price, quantity_in_stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (sku) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         category = EXCLUDED.category,
         unit_type = EXCLUDED.unit_type,
         base_unit = EXCLUDED.base_unit,
         base_price = EXCLUDED.base_price,
         quantity_in_stock = EXCLUDED.quantity_in_stock;`,
      [p.sku, p.name, p.description, p.category, p.unit_type, p.base_unit, p.base_price, p.quantity_in_stock]
    );
    console.log(`Inserted/updated ${p.sku}`);
  }
  console.log('Seeding complete.');
  process.exit(0);
}

seed().catch((e) => {
  console.error('Seed error', e);
  process.exit(1);
});

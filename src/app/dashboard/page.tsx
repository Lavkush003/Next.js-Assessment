import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import DashboardClient from './DashboardClient';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Fetch products
  const products = await query(`
    SELECT id, sku, name, description, category, unit_type, base_unit, base_price::float, quantity_in_stock::float 
    FROM products 
    ORDER BY name ASC
  `);

  // Fetch orders placed by this user
  const orders = await query(`
    SELECT o.id, o.status, o.total_price::float, o.created_at,
           JSON_AGG(
             JSON_BUILD_OBJECT(
               'id', oi.id,
               'product_name', p.name,
               'sku', p.sku,
               'ordered_quantity', oi.ordered_quantity::float,
               'ordered_unit', oi.ordered_unit,
               'base_quantity', oi.base_quantity::float,
               'base_unit', oi.base_unit,
               'unit_price', oi.unit_price::float,
               'total_price', oi.total_price::float
             )
           ) as items
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = $1
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `, [session.id]);

  return (
    <DashboardClient 
      initialProducts={products} 
      initialOrders={orders} 
      user={session} 
    />
  );
}

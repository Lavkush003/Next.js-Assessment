import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import AdminClient from './AdminClient';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  // Fetch products
  const products = await query(`
    SELECT id, sku, name, description, category, unit_type, base_unit, base_price::float, quantity_in_stock::float 
    FROM products 
    ORDER BY name ASC
  `);

  // Fetch all orders with user names
  const orders = await query(`
    SELECT o.id, o.status, o.total_price::float, o.created_at, u.name as user_name, u.email as user_email,
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
    JOIN users u ON o.user_id = u.id
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    GROUP BY o.id, u.name, u.email
    ORDER BY o.created_at DESC
  `);

  const productRequests = await query(`
    SELECT pr.id, pr.product_name, pr.description, pr.requested_quantity::float,
           pr.requested_unit, pr.status, pr.admin_notes, pr.created_at, pr.updated_at,
           u.name as user_name, u.email as user_email
    FROM product_requests pr
    JOIN users u ON pr.user_id = u.id
    ORDER BY pr.created_at DESC
  `);

  // Compute top product
  const productSales: Record<string, number> = {};
  orders.forEach((o: any) => {
    if (o.status === 'approved' || o.status === 'pending') {
      o.items?.forEach((item: any) => {
        if (!productSales[item.product_name]) productSales[item.product_name] = 0;
        productSales[item.product_name] += item.ordered_quantity;
      });
    }
  });

  let topProduct = 'None';
  let maxQty = 0;
  for (const [name, qty] of Object.entries(productSales)) {
    if (qty > maxQty) {
      maxQty = qty;
      topProduct = name;
    }
  }

  // Compute metrics
  const metrics = {
    totalRevenue: orders.filter((o: any) => o.status === 'approved').reduce((sum: number, o: any) => sum + o.total_price, 0),
    totalOrders: orders.length,
    pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
    pendingRequests: productRequests.filter((r: any) => r.status === 'pending').length,
    lowStockItems: products.filter((p: any) => {
      if (p.base_unit === 'g' || p.base_unit === 'mL') {
        return p.quantity_in_stock < 1000;
      }
      return p.quantity_in_stock < 10;
    }).length,
    topProduct
  };

  return (
    <AdminClient 
      initialProducts={products} 
      initialOrders={orders}
      initialProductRequests={productRequests}
      metrics={metrics} 
      user={session} 
    />
  );
}

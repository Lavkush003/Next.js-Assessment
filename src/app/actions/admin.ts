'use server';

import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface AdminActionResponse {
  success: boolean;
  error?: string;
}

// Ensure caller is admin
async function checkAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    throw new Error('Unauthorized. Admin access required.');
  }
}

// 1. Create Product
export async function createProductAction(formData: FormData): Promise<AdminActionResponse> {
  try {
    await checkAdmin();

    const sku = (formData.get('sku') as string).toUpperCase().trim();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const unit_type = formData.get('unit_type') as string;
    const base_unit = formData.get('base_unit') as string;
    const base_price = parseFloat(formData.get('base_price') as string);
    const quantity_in_stock = parseFloat(formData.get('quantity_in_stock') as string);

    if (!sku || !name || !category || !unit_type || !base_unit || isNaN(base_price) || isNaN(quantity_in_stock)) {
      return { success: false, error: 'All fields are required and must be valid.' };
    }

    // Check SKU uniqueness
    const skuCheck = await query('SELECT id FROM products WHERE sku = $1', [sku]);
    if (skuCheck.length > 0) {
      return { success: false, error: `Product with SKU "${sku}" already exists.` };
    }

    await query(
      `INSERT INTO products (sku, name, description, category, unit_type, base_unit, base_price, quantity_in_stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [sku, name, description, category, unit_type, base_unit, base_price, quantity_in_stock]
    );

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Create product error:', error);
    return { success: false, error: error.message || 'Failed to create product.' };
  }
}

// 2. Update Product
export async function updateProductAction(id: string, formData: FormData): Promise<AdminActionResponse> {
  try {
    await checkAdmin();

    const sku = (formData.get('sku') as string).toUpperCase().trim();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const unit_type = formData.get('unit_type') as string;
    const base_unit = formData.get('base_unit') as string;
    const base_price = parseFloat(formData.get('base_price') as string);
    const quantity_in_stock = parseFloat(formData.get('quantity_in_stock') as string);

    if (!sku || !name || !category || !unit_type || !base_unit || isNaN(base_price) || isNaN(quantity_in_stock)) {
      return { success: false, error: 'All fields are required and must be valid.' };
    }

    // Check SKU uniqueness excluding current product
    const skuCheck = await query('SELECT id FROM products WHERE sku = $1 AND id != $2', [sku, id]);
    if (skuCheck.length > 0) {
      return { success: false, error: `Another product with SKU "${sku}" already exists.` };
    }

    await query(
      `UPDATE products 
       SET sku = $1, name = $2, description = $3, category = $4, unit_type = $5, base_unit = $6, base_price = $7, quantity_in_stock = $8, updated_at = NOW()
       WHERE id = $9`,
      [sku, name, description, category, unit_type, base_unit, base_price, quantity_in_stock, id]
    );

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Update product error:', error);
    return { success: false, error: error.message || 'Failed to update product.' };
  }
}

// 3. Delete Product
export async function deleteProductAction(id: string): Promise<AdminActionResponse> {
  try {
    await checkAdmin();

    // Check if product is used in any orders
    const orderCheck = await query('SELECT id FROM order_items WHERE product_id = $1 LIMIT 1', [id]);
    if (orderCheck.length > 0) {
      return { 
        success: false, 
        error: 'Cannot delete product because it is referenced in past orders/quotations. Try updating its stock to 0 instead.' 
      };
    }

    await query('DELETE FROM products WHERE id = $1', [id]);

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Delete product error:', error);
    return { success: false, error: error.message || 'Failed to delete product.' };
  }
}

// 4. Update Order Status
export async function updateOrderStatusAction(orderId: string, status: 'pending' | 'approved' | 'rejected' | 'cancelled'): Promise<AdminActionResponse> {
  try {
    await checkAdmin();

    if (!['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
      return { success: false, error: 'Invalid order status.' };
    }

    // Lock and get previous status
    const orderRes = await query('SELECT status FROM orders WHERE id = $1', [orderId]);
    if (orderRes.length === 0) {
      return { success: false, error: 'Order not found.' };
    }

    const prevStatus = orderRes[0].status;

    // If order was approved and is now being rejected/cancelled, return the stock!
    if (prevStatus === 'approved' && (status === 'rejected' || status === 'cancelled')) {
      const items = await query('SELECT product_id, base_quantity FROM order_items WHERE order_id = $1', [orderId]);
      for (const item of items) {
        await query(
          'UPDATE products SET quantity_in_stock = quantity_in_stock + $1 WHERE id = $2',
          [item.base_quantity, item.product_id]
        );
      }
    } 
    // If order was rejected/cancelled and is now being approved, deduct the stock!
    else if ((prevStatus === 'rejected' || prevStatus === 'cancelled') && status === 'approved') {
      const items = await query('SELECT product_id, base_quantity, ordered_quantity, ordered_unit FROM order_items WHERE order_id = $1', [orderId]);
      
      // First verify stock is sufficient for all items
      for (const item of items) {
        const prod = await query('SELECT name, quantity_in_stock, base_unit FROM products WHERE id = $1', [item.product_id]);
        if (prod.length === 0) {
          throw new Error('Associated product not found.');
        }
        const stock = parseFloat(prod[0].quantity_in_stock);
        const req = parseFloat(item.base_quantity);
        if (req > stock) {
          throw new Error(`Cannot approve: Insufficient stock for "${prod[0].name}". Required: ${req} ${prod[0].base_unit}, Available: ${stock} ${prod[0].base_unit}`);
        }
      }

      // Deduct stock
      for (const item of items) {
        await query(
          'UPDATE products SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2',
          [item.base_quantity, item.product_id]
        );
      }
    }

    await query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [status, orderId]);

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Update order status error:', error);
    return { success: false, error: error.message || 'Failed to update order status.' };
  }
}

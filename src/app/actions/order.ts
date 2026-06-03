'use server';

import { getClient } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getConversionFactor, Unit } from '@/lib/conversions';

export interface CartItem {
  productId: string;
  quantity: number;
  unit: Unit;
}

export interface OrderResponse {
  success: boolean;
  error?: string;
  orderId?: string;
}

export async function placeOrderAction(items: CartItem[]): Promise<OrderResponse> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Unauthorized. Please login.' };
  }

  if (!items || items.length === 0) {
    return { success: false, error: 'Cannot place an empty order.' };
  }

  const client = await getClient();

  try {
    // Start transaction
    await client.query('BEGIN');

    let totalOrderPrice = 0;
    const orderItemsToInsert = [];

    // Verify stock and calculate conversions for each item
    for (const item of items) {
      if (item.quantity <= 0) {
        throw new Error('Quantity must be greater than zero.');
      }

      // Lock row for update to prevent concurrent stock modifications
      const prodRes = await client.query(
        'SELECT id, name, base_unit, base_price, quantity_in_stock, unit_type FROM products WHERE id = $1 FOR UPDATE',
        [item.productId]
      );

      if (prodRes.rows.length === 0) {
        throw new Error(`Product not found.`);
      }

      const product = prodRes.rows[0];
      const baseUnit = product.base_unit as Unit;
      const basePrice = parseFloat(product.base_price);
      const stock = parseFloat(product.quantity_in_stock);

      // Verify unit compatibility & calculate conversion
      let factor = 1;
      try {
        factor = getConversionFactor(baseUnit, item.unit);
      } catch (err: any) {
        throw new Error(`Invalid unit for ${product.name}: ${err.message}`);
      }

      const baseQuantity = item.quantity * factor;
      if (baseQuantity > stock) {
        throw new Error(`Insufficient stock for ${product.name}. Requested: ${item.quantity} ${item.unit} (equals ${baseQuantity.toFixed(4)} ${baseUnit}), Available: ${stock.toFixed(4)} ${baseUnit}`);
      }

      const unitPrice = basePrice * factor;
      const totalItemPrice = item.quantity * unitPrice;

      totalOrderPrice += totalItemPrice;

      orderItemsToInsert.push({
        productId: item.productId,
        orderedQuantity: item.quantity,
        orderedUnit: item.unit,
        baseQuantity,
        baseUnit,
        unitPrice,
        totalItemPrice,
      });
    }

    // Insert order header
    const orderRes = await client.query(
      'INSERT INTO orders (user_id, status, total_price) VALUES ($1, $2, $3) RETURNING id',
      [session.id, 'pending', totalOrderPrice]
    );

    const orderId = orderRes.rows[0].id;

    // Insert order items
    for (const oi of orderItemsToInsert) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, ordered_quantity, ordered_unit, base_quantity, base_unit, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          orderId,
          oi.productId,
          oi.orderedQuantity,
          oi.orderedUnit,
          oi.baseQuantity,
          oi.baseUnit,
          oi.unitPrice,
          oi.totalItemPrice,
        ]
      );
    }

    // Commit transaction
    await client.query('COMMIT');
    return { success: true, orderId };
  } catch (error: any) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Order placement failed:', error);
    return { success: false, error: error.message || 'Failed to place order.' };
  } finally {
    // Release client back to pool
    client.release();
  }
}

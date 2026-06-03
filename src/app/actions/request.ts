'use server';

import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface RequestActionResponse {
  success: boolean;
  error?: string;
}

export async function submitProductRequestAction(formData: FormData): Promise<RequestActionResponse> {
  const session = await getSession();
  if (!session || (session.role !== 'buyer' && session.role !== 'seller')) {
    return { success: false, error: 'Unauthorized. Buyer or seller access required.' };
  }

  const productName = (formData.get('product_name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const requestedQuantity = parseFloat(formData.get('requested_quantity') as string);
  const requestedUnit = (formData.get('requested_unit') as string)?.trim();

  if (!productName || !requestedUnit || isNaN(requestedQuantity) || requestedQuantity <= 0) {
    return { success: false, error: 'Product name, quantity, and unit are required.' };
  }

  try {
    await query(
      `INSERT INTO product_requests (user_id, product_name, description, requested_quantity, requested_unit, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [session.id, productName, description, requestedQuantity, requestedUnit]
    );

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Submit product request error:', error);
    return { success: false, error: error.message || 'Failed to submit request.' };
  }
}

export async function updateProductRequestStatusAction(
  requestId: string,
  status: 'pending' | 'reviewing' | 'fulfilled' | 'rejected',
  adminNotes?: string
): Promise<RequestActionResponse> {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { success: false, error: 'Unauthorized. Admin access required.' };
  }

  if (!['pending', 'reviewing', 'fulfilled', 'rejected'].includes(status)) {
    return { success: false, error: 'Invalid request status.' };
  }

  try {
    const existing = await query('SELECT id FROM product_requests WHERE id = $1', [requestId]);
    if (existing.length === 0) {
      return { success: false, error: 'Product request not found.' };
    }

    await query(
      `UPDATE product_requests SET status = $1, admin_notes = $2, updated_at = NOW() WHERE id = $3`,
      [status, adminNotes?.trim() || null, requestId]
    );

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Update product request status error:', error);
    return { success: false, error: error.message || 'Failed to update request.' };
  }
}

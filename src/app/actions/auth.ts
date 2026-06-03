'use server';

import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { login, logout } from '@/lib/auth';
import { redirect } from 'next/navigation';

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function loginAction(prevState: any, formData: FormData): Promise<ActionResponse> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  try {
    // 1. Fetch user by email
    const users = await query(
      'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const user = users[0];

    // 2. Verify password hash
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // 3. Set cookie session
    await login({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Success response - we will handle the redirect on the client side 
    // or trigger it below, but returning success is cleaner for form transitions
    return { success: true };
  } catch (error: any) {
    console.error('Login action error:', error);
    return { success: false, error: 'Internal server error. Please try again.' };
  }
}

export async function logoutAction() {
  await logout();
  redirect('/login');
}

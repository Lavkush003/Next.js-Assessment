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

  // Check if DATABASE_URL is properly configured
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('username:password@ep-host')) {
    return { 
      success: false, 
      error: '⚠️ Database not configured. Please update DATABASE_URL in your .env.local file with your real Neon connection string, then restart the dev server.' 
    };
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

    return { success: true };
  } catch (error: any) {
    console.error('Login action error:', error);
    // Provide a helpful message if it looks like a DB connection error
    if (error.message?.includes('ENOTFOUND') || error.message?.includes('connect') || error.message?.includes('ETIMEDOUT')) {
      return { success: false, error: 'Cannot connect to database. Check your DATABASE_URL in .env.local and restart the server.' };
    }
    return { success: false, error: `Server error: ${error.message || 'Please try again.'}` };
  }
}

export async function logoutAction() {
  await logout();
  redirect('/login');
}

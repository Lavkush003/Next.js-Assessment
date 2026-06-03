import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'aasa-medchem-super-secret-key-1234567890'
);

interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'seller' | 'buyer';
}

async function decrypt(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    return payload as unknown as UserSession;
  } catch (error) {
    return null;
  }
}

function getRoleHomePath(role: UserSession['role']): string {
  if (role === 'admin') return '/admin';
  return '/dashboard';
}

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const session = sessionToken ? await decrypt(sessionToken) : null;

  // Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    if (session.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Protect Dashboard Routes
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Public signup — redirect logged-in users away
  if (pathname === '/signup') {
    if (session) {
      return NextResponse.redirect(new URL(getRoleHomePath(session.role), request.url));
    }
    return NextResponse.next();
  }

  // Redirect authenticated users away from Login and Root
  if (pathname === '/login' || pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL(getRoleHomePath(session.role), request.url));
    }
    
    // If not logged in and visiting /, redirect to login
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/login', '/signup', '/'],
};

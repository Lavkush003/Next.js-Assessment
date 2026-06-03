'use client';

import React, { Suspense, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAction } from '@/app/actions/auth';
import { Activity, ShieldAlert } from 'lucide-react';
import styles from './login.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  
  const [state, formAction, isPending] = useActionState(loginAction, { success: false, error: undefined });

  useEffect(() => {
    if (state.success && state.role) {
      const getRedirectPath = (role: string) => {
        if (callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
          return callbackUrl;
        }
        if (role === 'admin') return '/admin';
        return '/dashboard';
      };
      router.push(getRedirectPath(state.role));
      router.refresh();
    }
  }, [state.success, state.role, callbackUrl, router]);

  const handleAutofill = (role: 'admin' | 'seller' | 'buyer') => {
    if (role === 'admin') {
      setEmail('admin@aasamedchem.com');
      setPassword('admin123');
    } else if (role === 'buyer') {
      setEmail('buyer@aasamedchem.com');
      setPassword('buyer123');
    } else {
      setEmail('seller@aasamedchem.com');
      setPassword('seller123');
    }
  };

  return (
    <div className={styles.splitContainer}>
      <div className={styles.leftPane}>
        <div className={styles.leftOverlay} />
        <div className={styles.leftContent}>
          <div className={styles.leftLogo}>
            <div className={styles.leftLogoIconContainer}>
              <Activity className={styles.leftLogoIcon} />
            </div>
            <span className={styles.leftLogoText}>AasaMedChem</span>
          </div>
          <h2 className={styles.leftTagline}>
            Empowering Chemistry, One Click at a Time: Your Inventory, Your Orders, Your Control.
          </h2>
        </div>
      </div>

      <div className={styles.rightPane}>
        <div className={styles.formContainer}>
          
          <div className={styles.mobileLogo}>
            <div className={styles.mobileLogoIconContainer}>
              <Activity className={styles.leftLogoIcon} />
            </div>
            <span className={styles.mobileLogoText}>AasaMedChem</span>
          </div>

          <div className={styles.header}>
            <h1 className={styles.title}>Login</h1>
            <p className={styles.subtitle}>Log in to your account.</p>
          </div>

          {state.error && (
            <div className={styles.errorAlert}>
              <ShieldAlert className={styles.errorIcon} />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                className={styles.input}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending || state.success}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                className={styles.input}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending || state.success}
                required
              />
              <div className={styles.forgotPassword}>
                <Link href="#">Forgot Password?</Link>
              </div>
            </div>

            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={isPending || state.success}
            >
              {isPending ? 'Authenticating...' : state.success ? 'Success! Redirecting...' : 'Log In'}
            </button>


          </form>

          <p className={styles.footerLink}>
            Don't have an account? <Link href="/signup">Sign Up</Link>
          </p>

          <div className={styles.divider}>
            <span className={styles.dividerText}>Quick Evaluation Autofill</span>
          </div>

          <div className={styles.autofillGrid}>
            <button
              onClick={() => handleAutofill('admin')}
              className={styles.autofillBtn}
              disabled={isPending || state.success}
              type="button"
            >
              <div className={styles.autofillRole}>Admin</div>
              <div className={styles.autofillCred}>admin@aasamedchem.com</div>
            </button>

            <button
              onClick={() => handleAutofill('seller')}
              className={styles.autofillBtn}
              disabled={isPending || state.success}
              type="button"
            >
              <div className={styles.autofillRole}>Seller</div>
              <div className={styles.autofillCred}>seller@aasamedchem.com</div>
            </button>

            <button
              onClick={() => handleAutofill('buyer')}
              className={styles.autofillBtn}
              disabled={isPending || state.success}
              style={{ gridColumn: '1 / -1' }}
              type="button"
            >
              <div className={styles.autofillRole}>Buyer</div>
              <div className={styles.autofillCred}>buyer@aasamedchem.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className={styles.splitContainer} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p>Loading...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

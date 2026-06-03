'use client';

import React, { Suspense, useState, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginAction } from '@/app/actions/auth';
import { Activity, Lock, Mail, ShieldAlert } from 'lucide-react';
import styles from './login.module.css';

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const getRedirectPath = (role: string) => {
    if (callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
      return callbackUrl;
    }
    if (role === 'admin') return '/admin';
    return '/dashboard';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const res = await loginAction(null, formData);

      if (res.success && res.role) {
        window.location.href = getRedirectPath(res.role);
      } else {
        setError(res.error || 'Authentication failed.');
      }
    });
  };

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
    <div className={styles.container}>
      <div className={`${styles.card} glass-panel animate-fade-in`}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <Activity className={styles.logoIcon} />
          </div>
          <h1 className={styles.title}>AasaMedChem</h1>
          <p className={styles.subtitle}>Inventory & Order Portal</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <ShieldAlert className={styles.errorIcon} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <div className={styles.inputWrapper}>
              <Mail className={styles.inputIcon} />
              <input
                type="email"
                className="glass-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} />
              <input
                type="password"
                className="glass-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={isPending}
          >
            {isPending ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className={styles.footerLink}>
          Need an account? <Link href="/signup">Sign up</Link>
        </p>

        <div className={styles.divider}>
          <span className={styles.dividerText}>Quick Evaluation Autofill</span>
        </div>

        <div className={styles.autofillGrid}>
          <button
            onClick={() => handleAutofill('admin')}
            className={styles.autofillBtn}
            disabled={isPending}
          >
            <div className={styles.autofillRole}>Admin</div>
            <div className={styles.autofillCred}>admin@aasamedchem.com</div>
          </button>

          <button
            onClick={() => handleAutofill('seller')}
            className={styles.autofillBtn}
            disabled={isPending}
          >
            <div className={styles.autofillRole}>Seller</div>
            <div className={styles.autofillCred}>seller@aasamedchem.com</div>
          </button>

          <button
            onClick={() => handleAutofill('buyer')}
            className={styles.autofillBtn}
            disabled={isPending}
            style={{ gridColumn: '1 / -1' }}
          >
            <div className={styles.autofillRole}>Buyer</div>
            <div className={styles.autofillCred}>buyer@aasamedchem.com</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={`${styles.card} glass-panel`}>
          <p className={styles.subtitle} style={{ textAlign: 'center' }}>Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

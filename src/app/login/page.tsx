'use client';

import React, { useState, useTransition } from 'react';
import { loginAction } from '@/app/actions/auth';
import { Activity, Lock, Mail, ShieldAlert } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const res = await loginAction(null, formData);

      if (res.success) {
        // Hard navigate so the Edge middleware sees the new session cookie
        window.location.href = '/';
      } else {
        setError(res.error || 'Authentication failed.');
      }
    });
  };

  const handleAutofill = (role: 'admin' | 'seller') => {
    if (role === 'admin') {
      setEmail('admin@aasamedchem.com');
      setPassword('admin123');
    } else {
      setEmail('seller@aasamedchem.com');
      setPassword('seller123');
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.card} glass-panel animate-fade-in`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <Activity className={styles.logoIcon} />
          </div>
          <h1 className={styles.title}>AasaMedChem</h1>
          <p className={styles.subtitle}>Inventory & Order Portal</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={styles.errorAlert}>
            <ShieldAlert className={styles.errorIcon} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
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

        {/* Test Accounts / Autofill Section */}
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
            <div className={styles.autofillRole}>Seller / User</div>
            <div className={styles.autofillCred}>seller@aasamedchem.com</div>
          </button>
        </div>
      </div>
    </div>
  );
}

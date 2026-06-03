'use client';

import React, { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signupAction } from '@/app/actions/auth';
import { Activity, ShieldAlert } from 'lucide-react';
import styles from './signup.module.css';

export default function SignupPage() {
  const router = useRouter();
  
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const [state, formAction, isPending] = useActionState(signupAction, { success: false, error: undefined });

  useEffect(() => {
    if (state.success) {
      router.push('/dashboard');
      router.refresh();
    }
  }, [state.success, router]);

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
            <h1 className={styles.title}>Sign Up</h1>
            <p className={styles.subtitle}>Create your AasaMedChem account.</p>
          </div>

          {state.error && (
            <div className={styles.errorAlert}>
              <ShieldAlert className={styles.errorIcon} />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Full Name</label>
              <input
                type="text"
                name="name"
                className={styles.input}
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending || state.success}
                required
              />
            </div>

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
                minLength={8}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className={styles.input}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isPending || state.success}
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={isPending || state.success}
              style={{ marginTop: '12px' }}
            >
              {isPending ? 'Creating account...' : state.success ? 'Success! Redirecting...' : 'Sign Up'}
            </button>


          </form>

          <p className={styles.footerLink}>
            Already have an account? <Link href="/login">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import LoginForm from '@/components/forms/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="glass-card p-8 w-full max-w-md mx-4">
        <LoginForm />
      </div>
    </div>
  );
}

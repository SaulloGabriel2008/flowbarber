'use client';

import RegisterForm from '@/components/forms/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="glass-card p-8 w-full max-w-md mx-4">
        <RegisterForm />
      </div>
    </div>
  );
}

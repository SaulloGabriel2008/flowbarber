'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/hooks/useAuth';
import { createUserProfile } from '@/lib/firebase/services/userService';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      // Redirecionar baseado no email (master admin = /admin)
      if (email === 'saullinho2008@gmail.com') {
        router.push('/admin/dashboard');
      } else {
        router.push('/client/index');
      }
    } catch (err) {
      setError(
        err.code === 'auth/user-not-found'
          ? 'Usuário não encontrado'
          : err.code === 'auth/wrong-password'
          ? 'Senha incorreta'
          : 'Erro ao fazer login'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-2xl font-bold font-['Playfair_Display'] text-[var(--color-primary)] mb-6">
          FLOW BARBER
        </h1>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field w-full"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field w-full"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <div className="text-center">
          <p className="text-sm text-[var(--text-tertiary)]">
            Não tem conta?{' '}
            <Link href="/register" className="text-[var(--color-primary)] hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;

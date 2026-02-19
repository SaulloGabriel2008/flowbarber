'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/hooks/useAuth';
import { createUserProfile } from '@/lib/firebase/services/userService';

const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await register(email, password);

      // Criar perfil no Firestore (padrão: cliente)
      await createUserProfile(user.uid, {
        email,
        displayName,
        phone,
        role: 'client',
      });

      router.push('/client/index');
    } catch (err) {
      setError(
        err.code === 'auth/email-already-in-use'
          ? 'Email já cadastrado'
          : err.code === 'auth/weak-password'
          ? 'Senha muito fraca (mínimo 6 caracteres)'
          : 'Erro ao cadastrar'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-2xl font-bold font-['Playfair_Display'] text-[var(--color-primary)] mb-2">
          FLOW BARBER
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mb-6">
          Crie sua conta para agendar
        </p>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
            Nome Completo
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input-field w-full"
            placeholder="Seu Nome"
            required
          />
        </div>

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
            Telefone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-field w-full"
            placeholder="(11) 99999-9999"
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
          {loading ? 'Cadastrando...' : 'Criar Conta'}
        </button>

        <div className="text-center">
          <p className="text-sm text-[var(--text-tertiary)]">
            Já tem conta?{' '}
            <Link href="/login" className="text-[var(--color-primary)] hover:underline">
              Faça login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;

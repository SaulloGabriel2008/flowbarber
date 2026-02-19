'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { useUser } from '@/lib/firebase/hooks/useUser';
import ThemeSwitcher from '@/components/shared/ThemeSwitcher';
import { useAuth } from '@/lib/firebase/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ClientProfile() {
  const { userData } = useUser();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  return (
    <ProtectedRoute requiredRole="client">
      <div className="space-y-6 pt-6">
        {/* Profile Header */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-3xl text-[var(--bg-primary)]">
              {userData?.displayName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{userData?.displayName}</h1>
              <p className="text-[var(--text-secondary)]">{userData?.email}</p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Informações Pessoais</h2>

          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
              Nome Completo
            </label>
            <input
              type="text"
              value={userData?.displayName || ''}
              readOnly
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
              Email
            </label>
            <input
              type="email"
              value={userData?.email || ''}
              readOnly
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
              Telefone
            </label>
            <input
              type="tel"
              value={userData?.phone || ''}
              readOnly
              className="input-field w-full"
            />
          </div>

          <button className="btn btn-secondary w-full" disabled>
            Editar Informações (Em desenvolvimento)
          </button>
        </div>

        {/* Preferences */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Preferências</h2>

          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
              Tema
            </label>
            <ThemeSwitcher />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
              Notificações
            </label>
            <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
              <span className="text-white">Notificações por Email</span>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Loyalty Stats */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Seu Histórico</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--bg-secondary)] rounded p-4 text-center">
              <p className="text-[var(--text-tertiary)] text-sm">Agendamentos</p>
              <p className="text-2xl font-bold text-white">12</p>
            </div>
            <div className="bg-[var(--bg-secondary)] rounded p-4 text-center">
              <p className="text-[var(--text-tertiary)] text-sm">Gasto Total</p>
              <p className="text-2xl font-bold text-[var(--color-primary)]">R$ 540</p>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Segurança</h2>
          <button className="btn btn-secondary w-full">
            Alterar Senha
          </button>
        </div>

        {/* Logout */}
        <div>
          {showLogoutConfirm ? (
            <div className="glass-card p-6 text-center space-y-4">
              <p className="text-white font-medium">Deseja sair da sua conta?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className="btn bg-red-600 text-white flex-1"
                >
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="btn btn-secondary w-full text-red-400"
            >
              <span className="material-symbols-outlined">logout</span>
              Sair da Conta
            </button>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

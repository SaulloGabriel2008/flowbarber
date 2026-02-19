'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { useAuth } from '@/lib/firebase/hooks/useAuth';
import { useUser } from '@/lib/firebase/hooks/useUser';
import { useFeatureFlags } from '@/lib/firebase/hooks/useFeatureFlags';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { userData } = useUser();
  const { multiBarbers, subscriptions } = useFeatureFlags();

  // Stats mock - em produção viria do Firestore
  const stats = [
    {
      label: 'Receita Mensal',
      value: 'R$ 12.840',
      icon: 'payments',
      trend: '+12%',
    },
    {
      label: 'Agendamentos',
      value: '142',
      icon: 'calendar_month',
      trend: 'Hoje: 12',
    },
    {
      label: 'Clientes',
      value: '487',
      icon: 'people',
      trend: '+23 novo',
    },
    {
      label: 'Saldo',
      value: 'R$ 8.950',
      icon: 'account_balance_wallet',
      trend: '+8%',
    },
  ];

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-['Playfair_Display'] text-white">
            Bem-vindo, {userData?.displayName}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Feature Toggles Status */}
        <div className="glass-card p-4 flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-primary)]">
              {multiBarbers ? 'check_circle' : 'cancel'}
            </span>
            <span className="text-sm">Multi-Barbeiros: {multiBarbers ? 'Ativo' : 'Inativo'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-primary)]">
              {subscriptions ? 'check_circle' : 'cancel'}
            </span>
            <span className="text-sm">Assinaturas: {subscriptions ? 'Ativo' : 'Inativo'}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="gradient-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{stat.trend}</p>
                </div>
                <span className="material-symbols-outlined text-[var(--color-primary)] text-3xl">
                  {stat.icon}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Ações Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/admin/appointments"
              className="glass-card p-4 hover:border-[var(--color-primary)] transition-all group"
            >
              <span className="material-symbols-outlined text-[var(--color-primary)] text-2xl mb-3 block">
                calendar_month
              </span>
              <p className="font-medium text-white group-hover:text-[var(--color-primary)]">
                Agendamentos
              </p>
            </Link>
            <Link
              href="/admin/clients"
              className="glass-card p-4 hover:border-[var(--color-primary)] transition-all group"
            >
              <span className="material-symbols-outlined text-[var(--color-primary)] text-2xl mb-3 block">
                people
              </span>
              <p className="font-medium text-white group-hover:text-[var(--color-primary)]">
                Clientes
              </p>
            </Link>
            <Link
              href="/admin/financials"
              className="glass-card p-4 hover:border-[var(--color-primary)] transition-all group"
            >
              <span className="material-symbols-outlined text-[var(--color-primary)] text-2xl mb-3 block">
                payments
              </span>
              <p className="font-medium text-white group-hover:text-[var(--color-primary)]">
                Finanças
              </p>
            </Link>
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Performance Semanal</h2>
          <div className="h-48 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center text-[var(--text-tertiary)]">
            <p>Gráfico será renderizado aqui com Recharts</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

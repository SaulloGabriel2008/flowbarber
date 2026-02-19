'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { useAuth } from '@/lib/firebase/hooks/useAuth';
import { useFeatureFlags } from '@/lib/firebase/hooks/useFeatureFlags';
import Link from 'next/link';

export default function ClientIndex() {
  const { user } = useAuth();
  const { multiBarbers, subscriptions } = useFeatureFlags();

  return (
    <ProtectedRoute requiredRole="client">
      <div className="space-y-6 pt-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase">Bem-vindo,</p>
            <h1 className="text-2xl font-bold text-white">Gustavo</h1>
          </div>
          <button className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--color-primary)]">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>

        {/* Promo Card */}
        <div className="gradient-card p-6 flex flex-col justify-between min-h-48">
          <div>
            <span className="inline-block mb-4 px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold rounded-full">
              Novo Cliente
            </span>
            <h2 className="text-2xl font-bold text-white mb-2">
              Ganhe 20% OFF no seu primeiro corte!
            </h2>
            <p className="text-[var(--text-secondary)] text-sm">
              Válido para agendamentos até 31 de março
            </p>
          </div>
          <Link
            href="/client/book"
            className="btn btn-primary w-full mt-4"
          >
            <span className="material-symbols-outlined text-lg">calendar_month</span>
            Agendar Agora
          </Link>
        </div>

        {/* Serviços Populares */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Serviços Populares</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Corte de Cabelo', price: '45,00', time: '30 min' },
              { name: 'Barba', price: '25,00', time: '20 min' },
              { name: 'Corte + Barba', price: '60,00', time: '45 min' },
              { name: 'Pigmentação', price: '35,00', time: '25 min' },
            ].map((service, idx) => (
              <div key={idx} className="glass-card p-4">
                <div className="w-full h-20 bg-[var(--bg-secondary)] rounded-lg mb-3"></div>
                <h4 className="font-bold text-white text-sm">{service.name}</h4>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {service.time} • R$ {service.price}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Próximos Agendamentos */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Próximos Agendamentos</h3>
          <div className="glass-card p-4 text-center text-[var(--text-secondary)]">
            <span className="material-symbols-outlined text-4xl text-[var(--color-primary)] mb-2 block">
              calendar_month
            </span>
            <p className="text-sm">Você não tem agendamentos próximos</p>
            <Link
              href="/client/book"
              className="inline-block mt-3 text-[var(--color-primary)] text-sm font-bold"
            >
              Agendar Agora →
            </Link>
          </div>
        </div>

        {/* Planos (se ativo) */}
        {subscriptions && (
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Nossos Planos</h3>
            <div className="gradient-card p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-white">Plano Premium</p>
                  <p className="text-2xl font-bold text-[var(--color-primary)]">R$ 99/mês</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">✓ 4 cortes/mês</p>
                </div>
                <button className="btn btn-primary btn-small">Contratar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

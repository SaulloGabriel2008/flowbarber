'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { useFeatureFlags } from '@/lib/firebase/hooks/useFeatureFlags';

export default function ClientSubscriptionsPage() {
  const { subscriptions } = useFeatureFlags();

  if (!subscriptions) {
    return (
      <ProtectedRoute requiredRole="client">
        <div className="glass-card p-6 text-center">
          <span className="material-symbols-outlined text-4xl text-[var(--text-tertiary)] block mb-3">
            card_membership
          </span>
          <p className="text-white font-bold">Sistema de Assinaturas Indisponível</p>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Este recurso não está disponível no momento
          </p>
        </div>
      </ProtectedRoute>
    );
  }

  const plans = [
    {
      id: '1',
      name: 'Plano Starter',
      price: 49.9,
      period: 'mês',
      features: ['2 cortes', 'Desconto 15%', 'Prioridade'],
      popular: false,
    },
    {
      id: '2',
      name: 'Plano Premium',
      price: 99.9,
      period: 'mês',
      features: ['4 cortes', 'Desconto 25%', 'Prioridade máxima'],
      popular: true,
    },
  ];

  return (
    <ProtectedRoute requiredRole="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Nossos Planos</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Escolha o plano ideal para você
          </p>
        </div>

        {/* Plans */}
        <div className="space-y-4">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`gradient-card p-6 relative ${
                plan.popular ? 'border-2 border-[var(--color-primary)]' : ''
              }`}
            >
              {plan.popular && (
                <span className="absolute top-4 right-4 badge badge-success">Mais Popular</span>
              )}

              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="mb-4">
                <p className="text-3xl font-bold text-[var(--color-primary)]">
                  R$ {plan.price.toFixed(2)}
                </p>
                <p className="text-sm text-[var(--text-tertiary)]">por {plan.period}</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-sm">
                      check
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button className="btn btn-primary w-full">
                Contratar Agora
              </button>
            </div>
          ))}
        </div>

        {/* Current Subscription */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Sua Assinatura Atual</h2>
          <div className="text-center text-[var(--text-secondary)]">
            <span className="material-symbols-outlined text-4xl block mb-3">
              card_membership
            </span>
            <p>Você não possui uma assinatura ativa</p>
            <p className="text-sm mt-2">Escolha um plano acima para começar</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

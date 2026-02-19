'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';

export default function AdminSubscriptions() {
  const plans = [
    {
      id: '1',
      name: 'Plano Starter',
      price: 49.9,
      billingCycle: 'monthly',
      features: [
        '2 cortes por mês',
        'Prioridade em agendamentos',
        'Desconto de 15%',
      ],
      activeSubscriptions: 34,
    },
    {
      id: '2',
      name: 'Plano Premium',
      price: 99.9,
      billingCycle: 'monthly',
      features: [
        '4 cortes por mês',
        'Prioridade máxima',
        'Desconto de 25%',
        'Atendimento prioritário',
      ],
      activeSubscriptions: 18,
    },
    {
      id: '3',
      name: 'Plano Anual',
      price: 999.0,
      billingCycle: 'yearly',
      features: [
        '12 cortes por ano',
        'Desconto de 30%',
        'Suporte 24/7',
        '2 acompanhantes grátis',
      ],
      activeSubscriptions: 7,
    },
  ];

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">Assinaturas</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Gerenciar planos de assinatura
            </p>
          </div>
          <button className="btn btn-primary">
            <span className="material-symbols-outlined">add</span>
            Novo Plano
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className="gradient-card flex flex-col">
              <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-3xl font-bold text-[var(--color-primary)] mb-1">
                R$ {plan.price.toFixed(2)}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mb-4">
                por {plan.billingCycle === 'monthly' ? 'mês' : 'ano'}
              </p>

              {/* Features */}
              <div className="space-y-2 flex-1 mb-4">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-sm">
                      check
                    </span>
                    {feature}
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="bg-[var(--bg-secondary)] rounded p-3 mb-4">
                <p className="text-xs text-[var(--text-tertiary)]">Assinaturas Ativas</p>
                <p className="text-2xl font-bold text-white">{plan.activeSubscriptions}</p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button className="w-full text-[var(--color-primary)] text-sm font-medium hover:underline">
                  Editar
                </button>
                <button className="w-full text-red-400 text-sm font-medium hover:underline">
                  Desativar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Subscriptions History */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Histórico de Assinaturas</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded">
              <div>
                <p className="font-medium text-white">Maria Silva</p>
                <p className="text-sm text-[var(--text-tertiary)]">Plano Premium</p>
              </div>
              <span className="badge badge-success">Ativa</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded">
              <div>
                <p className="font-medium text-white">João Carbon</p>
                <p className="text-sm text-[var(--text-tertiary)]">Plano Starter</p>
              </div>
              <span className="badge badge-success">Ativa</span>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

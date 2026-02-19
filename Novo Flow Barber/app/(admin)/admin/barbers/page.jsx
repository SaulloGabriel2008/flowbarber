'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';

export default function AdminBarbers() {
  const barbers = [
    {
      id: '1',
      name: 'Carlos Silva',
      email: 'carlos@flowbarber.com',
      phone: '(11) 99999-1111',
      status: 'active',
      appointments: 45,
      rating: 4.8,
    },
    {
      id: '2',
      name: 'Pedro Santos',
      email: 'pedro@flowbarber.com',
      phone: '(11) 99999-2222',
      status: 'active',
      appointments: 52,
      rating: 4.9,
    },
    {
      id: '3',
      name: 'João Costa',
      email: 'joao@flowbarber.com',
      phone: '(11) 99999-3333',
      status: 'inactive',
      appointments: 23,
      rating: 4.5,
    },
  ];

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">Barbeiros</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Total: {barbers.length} barbeiros
            </p>
          </div>
          <button className="btn btn-primary">
            <span className="material-symbols-outlined">add</span>
            Novo Barbeiro
          </button>
        </div>

        {/* Barbeiros Grid */}
        <div className="space-y-3">
          {barbers.map(barber => (
            <div key={barber.id} className="gradient-card">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white">{barber.name}</h4>
                  <p className="text-sm text-[var(--text-secondary)]">{barber.email}</p>
                  <p className="text-sm text-[var(--text-tertiary)]">{barber.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-tertiary)] uppercase">Status</p>
                    <span className={`badge ${barber.status === 'active' ? 'badge-success' : 'badge-cancelled'}`}>
                      {barber.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-[var(--border-glass)]">
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">Agendamentos</p>
                  <p className="font-bold text-white">{barber.appointments}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">Avaliação</p>
                  <p className="font-bold text-[var(--color-primary)]">⭐ {barber.rating}</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button className="text-[var(--color-primary)] text-sm font-medium hover:underline">
                  Editar
                </button>
                <span className="text-[var(--text-tertiary)]">•</span>
                <button className="text-[var(--color-primary)] text-sm font-medium hover:underline">
                  Horários
                </button>
                <span className="text-[var(--text-tertiary)]">•</span>
                <button className="text-[var(--color-primary)] text-sm font-medium hover:underline">
                  Serviços
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}

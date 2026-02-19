'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import AppointmentForm from '@/components/forms/AppointmentForm';

export default function BookAppointmentPage() {
  return (
    <ProtectedRoute requiredRole="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Agendar Consulta</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Escolha a data e horário mais conveniente
          </p>
        </div>

        <div className="glass-card p-6">
          <AppointmentForm />
        </div>
      </div>
    </ProtectedRoute>
  );
}

'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { getClientAppointments } from '@/lib/firebase/services/appointmentService';
import { useAuth } from '@/lib/firebase/hooks/useAuth';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ClientAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    if (!user) return;

    const loadAppointments = async () => {
      try {
        const apts = await getClientAppointments(user.uid);
        setAppointments(apts);
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [user]);

  const now = new Date();
  const upcomingAppointments = appointments.filter(apt => apt.date > now && apt.status !== 'cancelled');
  const pastAppointments = appointments.filter(apt => apt.date <= now || apt.status === 'cancelled');

  const renderAppointmentCard = (apt) => (
    <div key={apt.id} className="gradient-card">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-white">{apt.serviceName}</h4>
          <p className="text-sm text-[var(--text-secondary)]">
            {new Date(apt.date).toLocaleDateString('pt-BR')} às {apt.startTime}
          </p>
        </div>
        <span className="badge badge-pending">{apt.status}</span>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-[var(--color-primary)] font-bold">R$ {apt.price.toFixed(2)}</p>
        <button className="text-[var(--color-primary)] text-sm font-medium hover:underline">
          Ver Detalhes
        </button>
      </div>
    </div>
  );

  return (
    <ProtectedRoute requiredRole="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Meus Agendamentos</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Acompanhe seus agendamentos e histórico
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-[var(--border-glass)]">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Próximos ({upcomingAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`pb-3 font-medium transition-colors ${
              activeTab === 'past'
                ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Histórico ({pastAppointments.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="spinner" />
          </div>
        ) : (
          <div className="space-y-3">
            {activeTab === 'upcoming' ? (
              upcomingAppointments.length === 0 ? (
                <div className="glass-card p-6 text-center text-[var(--text-secondary)]">
                  <span className="material-symbols-outlined text-4xl text-[var(--color-primary)] mb-2 block">
                    calendar_month
                  </span>
                  <p>Você não tem agendamentos próximos</p>
                  <Link href="/client/book" className="inline-block mt-3 text-[var(--color-primary)] text-sm font-bold">
                    Agendar Agora →
                  </Link>
                </div>
              ) : (
                upcomingAppointments.map(renderAppointmentCard)
              )
            ) : (
              pastAppointments.length === 0 ? (
                <div className="glass-card p-6 text-center text-[var(--text-secondary)]">
                  <p>Você ainda não tem histórico de agendamentos</p>
                </div>
              ) : (
                pastAppointments.map(renderAppointmentCard)
              )
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

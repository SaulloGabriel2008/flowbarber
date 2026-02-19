'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { getActiveBarbers } from '@/lib/firebase/services/barberService';
import { useEffect, useState } from 'react';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const barbersData = await getActiveBarbers();
        setBarbers(barbersData);
      } catch (error) {
        console.error('Erro ao carregar barbeiros:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Dados mock de agendamentos - em produção viria do Firestore
  const mockAppointments = [
    {
      id: '1',
      clientName: 'João Silva',
      barberName: 'Carlos',
      service: 'Corte + Barba',
      time: '09:00',
      status: 'confirmed',
      price: 60,
    },
    {
      id: '2',
      clientName: 'Maria Santos',
      barberName: 'Pedro',
      service: 'Corte de Cabelo',
      time: '10:30',
      status: 'pending',
      price: 45,
    },
    {
      id: '3',
      clientName: 'Antonio Costa',
      barberName: 'Carlos',
      service: 'Barba',
      time: '14:00',
      status: 'completed',
      price: 25,
    },
  ];

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Agendamentos</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Calendário de agendamentos e detalhes
          </p>
        </div>

        {/* Filtros */}
        <div className="glass-card p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
              Data
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
              Barbeiro
            </label>
            <select className="input-field w-full">
              <option>Todos os barbeiros</option>
              {barbers.map(barber => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Agendamentos */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="spinner" />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[var(--text-secondary)] text-sm">
              {mockAppointments.length} agendamentos para {new Date(selectedDate).toLocaleDateString('pt-BR')}
            </p>
            {mockAppointments.map(apt => (
              <div key={apt.id} className="gradient-card">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-white">{apt.clientName}</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {apt.time} • {apt.barberName} • {apt.service}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge badge-confirmed">{apt.status}</span>
                    <p className="text-[var(--color-primary)] font-bold">R$ {apt.price}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="text-[var(--color-primary)] text-sm font-medium hover:underline">
                    Detalhes
                  </button>
                  <span className="text-[var(--text-tertiary)]">•</span>
                  <button className="text-red-400 text-sm font-medium hover:underline">
                    Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/hooks/useAuth';
import { useFeatureFlags } from '@/lib/firebase/hooks/useFeatureFlags';
import { getActiveBarbers } from '@/lib/firebase/services/barberService';
import { createAppointment, getAvailableSlots } from '@/lib/firebase/services/appointmentService';
import { useRouter } from 'next/navigation';

const AppointmentForm = () => {
  const { user } = useAuth();
  const { multiBarbers } = useFeatureFlags();
  const router = useRouter();

  // Estados do formulário
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Dados carregados
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingBarbers, setLoadingBarbers] = useState(true);

  // Carregar barbeiros se multi-barbeiros ativo
  useEffect(() => {
    if (!multiBarbers) return;

    const loadBarbers = async () => {
      try {
        const baData = await getActiveBarbers();
        setBarbers(baData);
        if (baData.length > 0) {
          setSelectedBarber(baData[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar barbeiros:', err);
      } finally {
        setLoadingBarbers(false);
      }
    };

    loadBarbers();
  }, [multiBarbers]);

  // Carregar serviços quando barbeiro muda
  useEffect(() => {
    if (!selectedBarber) return;

    const barberId = selectedBarber;
    // Aqui você carregaria os serviços do barbeiro
    // Por enquanto, usaremos dados mock
    setServices([
      {
        id: '1',
        name: 'Corte de Cabelo',
        price: 45,
        duration: 30,
      },
      {
        id: '2',
        name: 'Barba',
        price: 25,
        duration: 20,
      },
      {
        id: '3',
        name: 'Corte + Barba',
        price: 60,
        duration: 45,
      },
    ]);
  }, [selectedBarber]);

  // Carregar slots disponíveis quando data/barbeiro/serviço mudam
  useEffect(() => {
    if (!selectedDate || !selectedBarber || !selectedService) {
      setAvailableSlots([]);
      return;
    }

    const service = services.find(s => s.id === selectedService);
    if (!service) return;

    const loadSlots = async () => {
      try {
        const slots = await getAvailableSlots(
          selectedBarber,
          new Date(selectedDate),
          service.duration
        );
        setAvailableSlots(slots);
      } catch (err) {
        console.error('Erro ao carregar slots:', err);
      }
    };

    loadSlots();
  }, [selectedDate, selectedBarber, selectedService, services]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!user) throw new Error('Usuário não autenticado');
      if (!selectedBarber) throw new Error('Selecione um barbeiro');
      if (!selectedService) throw new Error('Selecione um serviço');
      if (!selectedDate) throw new Error('Selecione uma data');
      if (!selectedTime) throw new Error('Selecione um horário');

      const service = services.find(s => s.id === selectedService);
      const dateTime = new Date(selectedDate);

      // Calcular endTime
      const [hours, mins] = selectedTime.split(':').map(Number);
      const endHours = Math.floor((hours * 60 + mins + service.duration) / 60);
      const endMins = (hours * 60 + mins + service.duration) % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

      const appointmentData = {
        serviceId: selectedService,
        serviceName: service.name,
        date: dateTime,
        startTime: selectedTime,
        endTime: endTime,
        clientNotes: notes,
        price: service.price,
      };

      const appointmentId = await createAppointment(
        user.uid,
        selectedBarber,
        appointmentData
      );

      setSuccess('Agendamento criado com sucesso!');
      setTimeout(() => {
        router.push('/client/appointments');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {/* Seleção de Barbeiro */}
      {multiBarbers && barbers.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
            Escolha um Barbeiro
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {barbers.map((barber) => (
              <button
                key={barber.id}
                type="button"
                onClick={() => setSelectedBarber(barber.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedBarber === barber.id
                    ? 'border-[var(--color-primary)] bg-[var(--card-glass)]'
                    : 'border-[var(--border-glass)] bg-[var(--bg-secondary)]'
                }`}
              >
                <p className="font-bold text-white">{barber.name}</p>
                <p className="text-sm text-[var(--text-tertiary)]">
                  ⭐ {barber.rating?.toFixed(1) || 'N/A'}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seleção de Serviço */}
      <div>
        <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
          Selecione um Serviço
        </label>
        <div className="space-y-2">
          {services.map((service) => (
            <label
              key={service.id}
              className="flex items-center p-3 border border-[var(--border-glass)] rounded-lg cursor-pointer hover:bg-[var(--card-glass)] transition-all"
            >
              <input
                type="radio"
                value={service.id}
                checked={selectedService === service.id}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-4 h-4"
              />
              <div className="flex-1 ml-3">
                <p className="font-medium text-white">{service.name}</p>
                <p className="text-sm text-[var(--text-tertiary)]">
                  {service.duration} min • R$ {service.price.toFixed(2)}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Seleção de Data */}
      <div>
        <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
          Data
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="input-field w-full"
          required
        />
      </div>

      {/* Seleção de Horário */}
      {selectedDate && (
        <div>
          <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
            Horário Disponível
          </label>
          {availableSlots.length === 0 ? (
            <p className="text-[var(--text-tertiary)]">
              Nenhum horário disponível para esta data
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => setSelectedTime(slot.start)}
                  className={`p-2 rounded-lg border-2 font-medium transition-all ${
                    selectedTime === slot.start
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--bg-primary)]'
                      : 'border-[var(--border-glass)] bg-[var(--bg-secondary)] text-white'
                  }`}
                >
                  {slot.start}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Observações */}
      <div>
        <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
          Observações (Opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-field w-full p-3 rounded-lg border border-[var(--border-glass)]"
          rows={3}
          placeholder="Alguma informação especial que o barbeiro deve saber?"
        />
      </div>

      {/* Resumo */}
      {selectedService && (
        <div className="gradient-card p-4">
          <p className="text-sm text-[var(--text-tertiary)] mb-2">Resumo do Agendamento</p>
          <div className="space-y-1 text-white">
            <p className="font-bold">
              {services.find(s => s.id === selectedService)?.name}
            </p>
            {selectedDate && (
              <p className="text-sm">
                {new Date(selectedDate).toLocaleDateString('pt-BR')} às {selectedTime}
              </p>
            )}
            <p className="text-sm font-bold text-[var(--color-primary)]">
              R$ {services.find(s => s.id === selectedService)?.price.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full"
      >
        {loading ? 'Agendando...' : 'Confirmar Agendamento'}
      </button>
    </form>
  );
};

export default AppointmentForm;

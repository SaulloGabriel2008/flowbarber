import { 
  collection,
  addDoc, 
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config';

/**
 * Criar agendamento para cliente (salva em ambos os locais)
 * @param {string} clientId - ID do cliente
 * @param {string} barberId - ID do barbeiro
 * @param {object} appointmentData - Dados do agendamento
 */
export const createAppointment = async (clientId, barberId, appointmentData) => {
  const batch = writeBatch(db);
  
  try {
    const appointmentRef = doc(
      collection(db, 'barbers', barberId, 'appointments')
    );
    const clientAppointmentRef = doc(
      collection(db, 'clients', clientId, 'appointments')
    );

    const data = {
      ...appointmentData,
      clientId,
      barberId,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    batch.set(appointmentRef, data);
    batch.set(clientAppointmentRef, data);

    await batch.commit();
    return appointmentRef.id;
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    throw error;
  }
};

/**
 * Obter agendamentos do cliente
 */
export const getClientAppointments = async (clientId) => {
  try {
    const querySnapshot = await getDocs(
      collection(db, 'clients', clientId, 'appointments')
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Erro ao obter agendamentos do cliente:', error);
    throw error;
  }
};

/**
 * Obter próximos agendamentos do cliente (ordenados por data)
 */
export const getClientUpcomingAppointments = async (clientId) => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'clients', clientId, 'appointments'),
        where('status', '!=', 'cancelled')
      )
    );
    const appointments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return appointments.sort((a, b) => a.date - b.date);
  } catch (error) {
    console.error('Erro ao obter próximos agendamentos:', error);
    throw error;
  }
};

/**
 * Atualizar agendamento (em ambos os locais)
 */
export const updateAppointment = async (clientId, barberId, appointmentId, updates) => {
  const batch = writeBatch(db);
  
  try {
    const barberAppointmentRef = doc(
      db, 'barbers', barberId, 'appointments', appointmentId
    );
    const clientAppointmentRef = doc(
      db, 'clients', clientId, 'appointments', appointmentId
    );

    const data = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    batch.update(barberAppointmentRef, data);
    batch.update(clientAppointmentRef, data);

    await batch.commit();
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    throw error;
  }
};

/**
 * Cancelar agendamento
 */
export const cancelAppointment = async (clientId, barberId, appointmentId) => {
  try {
    await updateAppointment(clientId, barberId, appointmentId, {
      status: 'cancelled',
      cancelledAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    throw error;
  }
};

/**
 * Adicionar avaliação e comentário ao agendamento
 */
export const addAppointmentReview = async (clientId, barberId, appointmentId, rating, review) => {
  try {
    await updateAppointment(clientId, barberId, appointmentId, {
      rating,
      review,
      hasReview: true,
    });
  } catch (error) {
    console.error('Erro ao adicionar avaliação:', error);
    throw error;
  }
};

/**
 * Verificar conflitos de horário do barbeiro
 */
export const checkBarberTimeSlot = async (barberId, date, startTime, endTime) => {
  try {
    const appointmentsSnapshot = await getDocs(
      query(
        collection(db, 'barbers', barberId, 'appointments'),
        where('date', '==', date)
      )
    );

    const timeStart = parseInt(startTime.replace(':', ''));
    const timeEnd = parseInt(endTime.replace(':', ''));

    for (const doc of appointmentsSnapshot.docs) {
      const apt = doc.data();
      if (apt.status !== 'cancelled') {
        const aptStart = parseInt(apt.startTime.replace(':', ''));
        const aptEnd = parseInt(apt.endTime.replace(':', ''));

        // Verificar superposição
        if (!(timeEnd <= aptStart || timeStart >= aptEnd)) {
          return false; // Conflito encontrado
        }
      }
    }

    return true; // Sem conflitos
  } catch (error) {
    console.error('Erro ao verificar slot de tempo:', error);
    throw error;
  }
};

/**
 * Obter slots disponíveis para um barbeiro em uma data
 */
export const getAvailableSlots = async (barberId, date, durationMinutes = 30) => {
  try {
    // Obter horário de funcionamento do barbeiro
    const scheduleSnapshot = await getDocs(
      collection(db, 'barbers', barberId, 'schedule')
    );

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const schedule = scheduleSnapshot.docs
      .map(doc => doc.data())
      .find(s => s.dayOfWeek === dayOfWeek);

    if (!schedule || !schedule.isWorkingDay) {
      return []; // Barbeiro não trabalha neste dia
    }

    // Obter agendamentos do dia
    const appointmentsSnapshot = await getDocs(
      query(
        collection(db, 'barbers', barberId, 'appointments'),
        where('date', '==', date)
      )
    );

    const appointments = appointmentsSnapshot.docs
      .map(doc => doc.data())
      .filter(apt => apt.status !== 'cancelled');

    // Gerar slots disponíveis
    const slots = [];
    let currentTime = schedule.startTime;
    const endTime = schedule.endTime;
    const breakStart = schedule.breakStartTime;
    const breakEnd = schedule.breakEndTime;

    while (currentTime < endTime) {
      // Pular intervalo do almoço
      if (currentTime >= breakStart && currentTime < breakEnd) {
        currentTime = addMinutes(breakEnd, 0);
        continue;
      }

      // Calcular hora final do slot
      const slotEnd = addMinutes(currentTime, durationMinutes);

      if (slotEnd <= endTime) {
        // Verificar se há conflito
        const hasConflict = appointments.some(apt => {
          const aptStart = parseInt(apt.startTime.replace(':', ''));
          const aptEnd = parseInt(apt.endTime.replace(':', ''));
          const slotStartInt = parseInt(currentTime.replace(':', ''));
          const slotEndInt = parseInt(slotEnd.replace(':', ''));

          return !(slotEndInt <= aptStart || slotStartInt >= aptEnd);
        });

        if (!hasConflict) {
          slots.push({
            start: currentTime,
            duration: durationMinutes,
          });
        }
      }

      currentTime = addMinutes(currentTime, 30); // Verificar a cada 30 min
    }

    return slots;
  } catch (error) {
    console.error('Erro ao obter slots disponíveis:', error);
    throw error;
  }
};

// Helper para adicionar minutos a uma hora (formato "HH:MM")
function addMinutes(timeStr, minutes) {
  const [hours, mins] = timeStr.split(':').map(Number);
  let totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60) % 24;
  const newMins = totalMins % 60;
  
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

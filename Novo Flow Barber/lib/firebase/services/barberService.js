import { 
  doc, 
  collection,
  setDoc, 
  getDoc, 
  updateDoc, 
  getDocs,
  query,
  where,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config';

/**
 * Criar perfil de barbeiro
 */
export const createBarber = async (barberId, barberData) => {
  try {
    await setDoc(doc(db, 'barbers', barberId), {
      ...barberData,
      active: true,
      rating: 0,
      totalReviews: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erro ao criar barbeiro:', error);
    throw error;
  }
};

/**
 * Obter todos os barbeiros ativos
 */
export const getActiveBarbers = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'barbers'), where('active', '==', true))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Erro ao obter barbeiros:', error);
    throw error;
  }
};

/**
 * Obter dados do barbeiro
 */
export const getBarber = async (barberId) => {
  try {
    const barberDoc = await getDoc(doc(db, 'barbers', barberId));
    if (barberDoc.exists()) {
      return {
        id: barberDoc.id,
        ...barberDoc.data(),
      };
    }
    throw new Error('Barbeiro não encontrado');
  } catch (error) {
    console.error('Erro ao obter barbeiro:', error);
    throw error;
  }
};

/**
 * Atualizar perfil do barbeiro
 */
export const updateBarber = async (barberId, updates) => {
  try {
    await updateDoc(doc(db, 'barbers', barberId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erro ao atualizar barbeiro:', error);
    throw error;
  }
};

/**
 * Obter horários do barbeiro
 */
export const getBarberSchedule = async (barberId) => {
  try {
    const querySnapshot = await getDocs(
      collection(db, 'barbers', barberId, 'schedule')
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Erro ao obter horários:', error);
    throw error;
  }
};

/**
 * Atualizar horário do barbeiro
 */
export const updateBarberSchedule = async (barberId, dayOfWeek, scheduleData) => {
  try {
    const scheduleRef = collection(db, 'barbers', barberId, 'schedule');
    const existingSchedule = await getDocs(
      query(scheduleRef, where('dayOfWeek', '==', dayOfWeek))
    );

    if (existingSchedule.empty) {
      await addDoc(scheduleRef, {
        dayOfWeek,
        ...scheduleData,
      });
    } else {
      await updateDoc(existingSchedule.docs[0].ref, scheduleData);
    }
  } catch (error) {
    console.error('Erro ao atualizar horário:', error);
    throw error;
  }
};

/**
 * Obter serviços do barbeiro
 */
export const getBarberServices = async (barberId) => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'barbers', barberId, 'services'),
        where('active', '==', true)
      )
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Erro ao obter serviços:', error);
    throw error;
  }
};

/**
 * Adicionar serviço ao barbeiro
 */
export const addBarberService = async (barberId, serviceData) => {
  try {
    const docRef = await addDoc(
      collection(db, 'barbers', barberId, 'services'),
      {
        ...serviceData,
        active: true,
        createdAt: Timestamp.now(),
      }
    );
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar serviço:', error);
    throw error;
  }
};

/**
 * Obter agendamentos do barbeiro
 */
export const getBarberAppointments = async (barberId, startDate, endDate) => {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'barbers', barberId, 'appointments'),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      )
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Erro ao obter agendamentos:', error);
    throw error;
  }
};

/**
 * Criar agendamento para o barbeiro
 */
export const createBarberAppointment = async (barberId, appointmentData) => {
  try {
    const docRef = await addDoc(
      collection(db, 'barbers', barberId, 'appointments'),
      {
        ...appointmentData,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
    );
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    throw error;
  }
};

/**
 * Atualizar agendamento do barbeiro
 */
export const updateBarberAppointment = async (barberId, appointmentId, updates) => {
  try {
    await updateDoc(
      doc(db, 'barbers', barberId, 'appointments', appointmentId),
      {
        ...updates,
        updatedAt: Timestamp.now(),
      }
    );
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    throw error;
  }
};

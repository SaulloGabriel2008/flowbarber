import { doc, setDoc, getDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../config';

/**
 * Criar perfil de usuário no Firestore
 */
export const createUserProfile = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      role: userData.role || 'client',
      isMasterAdmin: userData.email === 'saullinho2008@gmail.com',
      status: 'active',
      preferences: {
        theme: 'gold',
        notifications: true,
        language: 'pt-BR',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Erro ao criar perfil de usuário:', error);
    throw error;
  }
};

/**
 * Obter dados do usuário
 */
export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    throw new Error('Usuário não encontrado');
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    throw error;
  }
};

/**
 * Atualizar perfil de usuário
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
};

/**
 * Atualizar preferências de tema do usuário
 */
export const updateUserTheme = async (userId, theme) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      'preferences.theme': theme,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Erro ao atualizar tema do usuário:', error);
    throw error;
  }
};

/**
 * Obter todos os admins
 */
export const getAdmins = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'admin'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Erro ao obter admins:', error);
    throw error;
  }
};

/**
 * Obter todos os clientes
 */
export const getClients = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'client'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Erro ao obter clientes:', error);
    throw error;
  }
};

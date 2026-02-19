import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config';

/**
 * Obter configurações globais
 */
export const getGlobalSettings = async () => {
  try {
    const settings = await getDoc(doc(db, 'settings', 'globalConfig'));
    if (settings.exists()) {
      return settings.data();
    }
    throw new Error('Configurações não encontradas');
  } catch (error) {
    console.error('Erro ao obter settings:', error);
    throw error;
  }
};

/**
 * Atualizar feature flags (apenas master admin)
 */
export const updateFeatureFlags = async (flags) => {
  try {
    await updateDoc(doc(db, 'settings', 'globalConfig'), {
      'features.multiBarbers': flags.multiBarbers !== undefined ? flags.multiBarbers : undefined,
      'features.subscriptions': flags.subscriptions !== undefined ? flags.subscriptions : undefined,
      'features.maintenanceMode': flags.maintenanceMode !== undefined ? flags.maintenanceMode : undefined,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Erro ao atualizar feature flags:', error);
    throw error;
  }
};

/**
 * Atualizar tema global
 */
export const updateGlobalTheme = async (theme) => {
  try {
    await updateDoc(doc(db, 'settings', 'globalConfig'), {
      'theme.currentTheme': theme,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Erro ao atualizar tema:', error);
    throw error;
  }
};

/**
 * Atualizar informações da empresa
 */
export const updateCompanyInfo = async (companyData) => {
  try {
    await updateDoc(doc(db, 'settings', 'globalConfig'), {
      company: companyData,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Erro ao atualizar informações da empresa:', error);
    throw error;
  }
};

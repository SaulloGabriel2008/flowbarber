import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config';
import { useAuth } from './useAuth';

export const useTheme = () => {
  const { user } = useAuth();
  const [theme, setTheme] = useState('gold');
  const [loading, setLoading] = useState(true);

  // Ler tema do usuário
  useEffect(() => {
    if (!user) {
      // Ler tema global se não autenticado
      const unsubscribe = onSnapshot(
        doc(db, 'settings', 'globalConfig'),
        (snapshot) => {
          if (snapshot.exists()) {
            setTheme(snapshot.data().theme?.currentTheme || 'gold');
          }
          setLoading(false);
        }
      );
      return () => unsubscribe();
    }

    // Ler tema específico do usuário
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        if (snapshot.exists() && snapshot.data().preferences?.theme) {
          setTheme(snapshot.data().preferences.theme);
        } else {
          // Fallback para tema global
          const globalUnsub = onSnapshot(
            doc(db, 'settings', 'globalConfig'),
            (globalSnapshot) => {
              if (globalSnapshot.exists()) {
                setTheme(globalSnapshot.data().theme?.currentTheme || 'gold');
              }
            }
          );
          return () => globalUnsub();
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Aplicar tema no documento
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'gold');
    }
  }, [theme]);

  return {
    theme,
    setTheme,
    loading,
    availableThemes: ['blue', 'gold'],
  };
};

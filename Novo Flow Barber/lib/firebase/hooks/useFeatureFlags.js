import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config';

export const useFeatureFlags = () => {
  const [flags, setFlags] = useState({
    multiBarbers: false,
    subscriptions: false,
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'globalConfig'),
      (snapshot) => {
        if (snapshot.exists()) {
          const { features } = snapshot.data();
          setFlags(features || {});
        }
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao ler feature flags:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    ...flags,
    loading,
    error,
  };
};

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config';
import { useAuth } from './useAuth';

export const useUser = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setUserData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          setUserData(snapshot.data());
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return {
    userData,
    loading,
    error,
    role: userData?.role,
    isMasterAdmin: userData?.email === 'saullinho2008@gmail.com',
    isAdmin: userData?.role === 'admin' || userData?.email === 'saullinho2008@gmail.com',
    isBarber: userData?.role === 'barber',
    isClient: userData?.role === 'client',
  };
};

import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/hooks/useAuth';
import { useUser } from '@/lib/firebase/hooks/useUser';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { userData, role, isAdmin, isMasterAdmin } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Determinar layout baseado no role
  const getLayout = () => {
    if (!isAuthenticated) return 'public';
    if (isAdmin) return 'admin';
    if (role === 'barber') return 'barber';
    return 'client';
  };

  const value = {
    user,
    userData,
    isAuthenticated,
    role,
    isAdmin,
    isMasterAdmin,
    layout: getLayout(),
    sidebarOpen,
    setSidebarOpen,
    selectedBarber,
    setSelectedBarber,
    notifications,
    setNotifications,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext deve ser usado dentro de AppProvider');
  }
  return context;
};

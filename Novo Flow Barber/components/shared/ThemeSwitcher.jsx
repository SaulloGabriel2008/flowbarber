'use client';

import { useTheme } from '@/lib/firebase/hooks/useTheme';
import { updateUserTheme } from '@/lib/firebase/services/userService';
import { useAuth } from '@/lib/firebase/hooks/useAuth';
import { useState } from 'react';

const ThemeSwitcher = () => {
  const { theme, setTheme, availableThemes } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleThemeChange = async (newTheme) => {
    try {
      setLoading(true);
      if (user) {
        await updateUserTheme(user.uid, newTheme);
      }
      setTheme(newTheme);
    } catch (error) {
      console.error('Erro ao alterar tema:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 glass-card rounded-lg">
      {availableThemes.map((t) => (
        <button
          key={t}
          onClick={() => handleThemeChange(t)}
          disabled={loading}
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
            theme === t
              ? 'bg-[var(--color-primary)] text-[var(--bg-primary)]'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--color-primary)]'
          } disabled:opacity-50`}
          title={t === 'gold' ? 'Tema Dourado' : 'Tema Azul'}
        >
          <span className="material-symbols-outlined">
            {t === 'gold' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;

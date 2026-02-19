'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/hooks/useAuth';
import { useAppContext } from '@/lib/contexts/AppContext';

const ClientBottomNav = () => {
  const { logout } = useAuth();
  const { userData } = useAppContext();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  const navItems = [
    {
      label: 'Início',
      icon: 'home',
      href: '/client/index',
    },
    {
      label: 'Agendar',
      icon: 'calendar_month',
      href: '/client/book',
    },
    {
      label: 'Meus Agendamentos',
      icon: 'event',
      href: '/client/appointments',
    },
    {
      label: 'Planos',
      icon: 'card_membership',
      href: '/client/subscriptions',
    },
    {
      label: 'Perfil',
      icon: 'account_circle',
      href: '/client/profile',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--card-glass)] backdrop-blur-xl border-t border-[var(--border-glass)] z-50 max-w-md mx-auto">
      <div className="flex justify-around items-center h-20">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 py-3 px-4 text-[var(--text-tertiary)] hover:text-[var(--color-primary)] transition-colors group"
          >
            <span className="material-symbols-outlined text-2xl">{item.icon}</span>
            <span className="text-[10px] font-bold uppercase">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Logout em menu dropdown */}
      <div className="absolute bottom-20 right-0 bg-[var(--card-glass)] rounded-lg p-2 hidden group-hover:block">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-red-400 hover:bg-red-500/10 rounded text-sm font-medium"
        >
          Sair
        </button>
      </div>
    </nav>
  );
};

export default ClientBottomNav;

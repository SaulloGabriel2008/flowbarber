'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/hooks/useAuth';
import { useAppContext } from '@/lib/contexts/AppContext';
import { useState } from 'react';

const AdminSidebar = () => {
  const { logout } = useAuth();
  const { isMasterAdmin, userData, sidebarOpen, setSidebarOpen } = useAppContext();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  const menuItems = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      href: '/admin/dashboard',
    },
    {
      label: 'Agendamentos',
      icon: 'calendar_month',
      href: '/admin/appointments',
    },
    {
      label: 'Clientes',
      icon: 'people',
      href: '/admin/clients',
    },
    {
      label: 'Barbeiros',
      icon: 'person',
      href: '/admin/barbers',
    },
    {
      label: 'Finanças',
      icon: 'payments',
      href: '/admin/financials',
    },
    ...(true ? [
      {
        label: 'Assinaturas',
        icon: 'card_membership',
        href: '/admin/subscriptions',
      },
    ] : []),
    {
      label: 'Configurações',
      icon: 'settings',
      href: '/admin/settings',
    },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 glass-card text-white"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 glass-card m-0 border-r border-[var(--border-glass)] z-40 transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[var(--border-glass)]">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--bg-primary)] text-2xl">
                scissors
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-sm">FLOW</span>
              <span className="text-[10px] text-[var(--text-tertiary)]">BARBER</span>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-[var(--border-glass)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--bg-primary)]">
              {userData?.displayName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {userData?.displayName}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {isMasterAdmin ? 'Admin Master' : 'Admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--card-glass)] hover:text-[var(--color-primary)] transition-all group"
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[var(--border-glass)]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="font-medium text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}
    </>
  );
};

export default AdminSidebar;

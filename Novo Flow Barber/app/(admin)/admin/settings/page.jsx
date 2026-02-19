'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import ThemeSwitcher from '@/components/shared/ThemeSwitcher';
import { useUser } from '@/lib/firebase/hooks/useUser';
import { useFeatureFlags } from '@/lib/firebase/hooks/useFeatureFlags';
import { updateFeatureFlags } from '@/lib/firebase/services/settingsService';
import { useState } from 'react';

export default function AdminSettings() {
  const { isMasterAdmin, userData } = useUser();
  const { multiBarbers, subscriptions } = useFeatureFlags();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isMasterAdmin) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="glass-card p-6 text-center">
          <span className="material-symbols-outlined text-4xl text-red-400 block mb-3">
            lock
          </span>
          <p className="text-white font-bold">Acesso Restrito</p>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Apenas o Admin Master pode acessar esta página
          </p>
        </div>
      </ProtectedRoute>
    );
  }

  const handleToggleFeature = async (feature) => {
    setLoading(true);
    try {
      if (feature === 'multiBarbers') {
        await updateFeatureFlags({ multiBarbers: !multiBarbers });
      } else if (feature === 'subscriptions') {
        await updateFeatureFlags({ subscriptions: !subscriptions });
      }
      setSuccessMessage(`Feature ${feature} atualizado com sucesso!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao atualizar feature:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Configurações do Sistema</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Apenas Admin Master (saullinho2008@gmail.com) pode modificar estas configurações
          </p>
        </div>

        {successMessage && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
            {successMessage}
          </div>
        )}

        {/* Tema Global */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Tema Global</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-4">
            Escolha o tema padrão do sistema
          </p>
          <ThemeSwitcher />
        </div>

        {/* Feature Toggles */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-white mb-4">Feature Toggles</h2>

          {/* Multi-Barbeiros */}
          <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg">
            <div>
              <p className="font-bold text-white">Multi-Barbeiros</p>
              <p className="text-sm text-[var(--text-tertiary)]">
                Permitir múltiplos barbeiros no sistema
              </p>
            </div>
            <button
              onClick={() => handleToggleFeature('multiBarbers')}
              disabled={loading}
              className={`w-14 h-8 rounded-full transition-all ${
                multiBarbers
                  ? 'bg-[var(--color-primary)]'
                  : 'bg-[var(--text-tertiary)]'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  multiBarbers ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Assinaturas */}
          <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg">
            <div>
              <p className="font-bold text-white">Sistema de Assinaturas</p>
              <p className="text-sm text-[var(--text-tertiary)]">
                Ativar planos de assinatura para clientes
              </p>
            </div>
            <button
              onClick={() => handleToggleFeature('subscriptions')}
              disabled={loading}
              className={`w-14 h-8 rounded-full transition-all ${
                subscriptions
                  ? 'bg-[var(--color-primary)]'
                  : 'bg-[var(--text-tertiary)]'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  subscriptions ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Dados da Empresa */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-white mb-4">Informações da Empresa</h2>

          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
              Nome da Barbearia
            </label>
            <input
              type="text"
              defaultValue="Flow Barber"
              className="input-field w-full"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
              Telefone
            </label>
            <input
              type="tel"
              defaultValue="+55 11 99999-9999"
              className="input-field w-full"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
              Horário de Funcionamento (Segunda)
            </label>
            <div className="flex gap-2">
              <input
                type="time"
                defaultValue="09:00"
                className="input-field flex-1"
                disabled
              />
              <input
                type="time"
                defaultValue="18:00"
                className="input-field flex-1"
                disabled
              />
            </div>
          </div>

          <button className="btn btn-primary w-full" disabled>
            Salvar Alterações (Edição desativada nesta demo)
          </button>
        </div>

        {/* Segurança */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Segurança</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-4">
            Admin Master: {userData?.email}
          </p>
          <button className="btn btn-secondary">
            Alterar Senha
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}

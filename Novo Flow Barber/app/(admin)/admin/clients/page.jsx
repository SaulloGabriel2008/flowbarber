'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { getClients } from '@/lib/firebase/services/userService';
import { useEffect, useState } from 'react';

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await getClients();
        setClients(clientsData);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const filteredClients = clients.filter(client =>
    client.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">Clientes</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Total: {clients.length} clientes
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="glass-card p-4">
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full"
          />
        </div>

        {/* Clients Table */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="spinner" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="glass-card p-6 text-center text-[var(--text-secondary)]">
            <p>Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClients.map(client => (
              <div key={client.id} className="gradient-card">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white">{client.displayName}</h4>
                    <p className="text-sm text-[var(--text-secondary)]">{client.email}</p>
                    {client.phone && (
                      <p className="text-sm text-[var(--text-tertiary)]">{client.phone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-tertiary)] uppercase">Status</p>
                    <span className="badge badge-success">{client.status || 'Active'}</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="text-[var(--color-primary)] text-sm font-medium hover:underline">
                    Ver Agendamentos
                  </button>
                  <span className="text-[var(--text-tertiary)]">•</span>
                  <button className="text-[var(--color-primary)] text-sm font-medium hover:underline">
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

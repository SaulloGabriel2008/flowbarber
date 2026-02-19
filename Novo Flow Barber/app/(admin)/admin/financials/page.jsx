'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { useState, useEffect } from 'react';
import { getTotalBalance, getMonthlyRevenue, getExpensesByCategory } from '@/lib/firebase/services/financialService';

export default function AdminFinancials() {
  const [balance, setBalance] = useState({ income: 0, expense: 0, balance: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [expenses, setExpenses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const balanceData = await getTotalBalance();
        setBalance(balanceData);

        const currentDate = new Date();
        const monthRevenue = await getMonthlyRevenue(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1
        );
        setMonthlyRevenue(monthRevenue);

        const expensesByCategory = await getExpensesByCategory(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1
        );
        setExpenses(expensesByCategory);
      } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Finanças</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Acompanhe receitas e despesas
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Resumo Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="gradient-card">
                <p className="text-xs text-[var(--text-tertiary)] uppercase mb-2">Renda Total</p>
                <p className="text-3xl font-bold text-[var(--color-primary)]">
                  R$ {balance.income.toFixed(2)}
                </p>
              </div>
              <div className="gradient-card">
                <p className="text-xs text-[var(--text-tertiary)] uppercase mb-2">Despesas Total</p>
                <p className="text-3xl font-bold text-red-400">
                  R$ {balance.expense.toFixed(2)}
                </p>
              </div>
              <div className="gradient-card">
                <p className="text-xs text-[var(--text-tertiary)] uppercase mb-2">Saldo</p>
                <p className={`text-3xl font-bold ${balance.balance >= 0 ? 'text-[var(--color-primary)]' : 'text-red-400'}`}>
                  R$ {balance.balance.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Receita do Mês */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-4">Receita do Mês</h2>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-[var(--text-secondary)] text-sm">Receita</p>
                  <p className="text-3xl font-bold text-[var(--color-primary)]">
                    R$ {monthlyRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="flex-1 h-20 bg-[var(--bg-secondary)] rounded flex items-end">
                  {/* Placeholder para gráfico */}
                </div>
              </div>
            </div>

            {/* Despesas por Categoria */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-4">Despesas por Categoria</h2>
              {Object.keys(expenses).length === 0 ? (
                <p className="text-[var(--text-tertiary)]">Sem despesas cadastradas</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(expenses).map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded">
                      <span className="text-white capitalize">{category}</span>
                      <span className="font-bold text-red-400">R$ {amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lançar Despesa */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-4">Lançar Despesa</h2>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="text"
                  placeholder="Descrição"
                  className="input-field w-full"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Valor"
                    step="0.01"
                    className="input-field"
                  />
                  <select className="input-field">
                    <option>Selecione Categoria</option>
                    <option>Produtos</option>
                    <option>Aluguel</option>
                    <option>Energia</option>
                    <option>Funcionários</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary w-full">
                  Lançar Despesa
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

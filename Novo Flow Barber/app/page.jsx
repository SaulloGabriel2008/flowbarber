'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-6">
      <div className="glass-card p-12 max-w-md text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-[var(--bg-primary)]">
              scissors
            </span>
          </div>
        </div>

        {/* Título */}
        <div>
          <h1 className="text-4xl font-bold font-['Playfair_Display'] text-white mb-2">
            FLOW
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Sistema de Agendamentos para Barbearias
          </p>
        </div>

        {/* Descrição */}
        <p className="text-[var(--text-secondary)]">
          Gerencie sua barbearia com eficiência. Sistema SaaS escalável com suporte a múltiplos barbeiros e assinaturas.
        </p>

        {/* Botões */}
        <div className="space-y-3">
          <Link
            href="/login"
            className="btn btn-primary w-full"
          >
            <span className="material-symbols-outlined text-lg">login</span>
            Entrar
          </Link>
          <Link
            href="/register"
            className="btn btn-secondary w-full"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Cadastrar
          </Link>
        </div>

        {/* Features */}
        <div className="space-y-3 text-sm text-[var(--text-secondary)]">
          <p className="flex items-center gap-2 justify-center">
            <span className="material-symbols-outlined text-[var(--color-primary)]">check_circle</span>
            Multi-Barbeiros
          </p>
          <p className="flex items-center gap-2 justify-center">
            <span className="material-symbols-outlined text-[var(--color-primary)]">check_circle</span>
            Sistema de Assinaturas
          </p>
          <p className="flex items-center gap-2 justify-center">
            <span className="material-symbols-outlined text-[var(--color-primary)]">check_circle</span>
            Temas Customizáveis
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[var(--text-tertiary)] text-xs mt-12">
        © 2026 Flow Barber. Todos os direitos reservados.
      </p>
    </div>
  );
}

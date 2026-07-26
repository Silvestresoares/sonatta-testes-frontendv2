import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PortalLayout({ children }) {
  const navigate = useNavigate();
  const nome = localStorage.getItem('@sonatta:portal_nome') || 'Usuário';

  const handleLogout = () => {
    localStorage.removeItem('@sonatta:portal_token');
    localStorage.removeItem('@sonatta:portal_nome');
    localStorage.removeItem('@sonatta:portal_tipo');
    navigate('/portal/login');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Navbar simplificada para o portal */}
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-emerald-400 text-3xl font-bold" style={{ fontFamily: "'Dancing Script', cursive" }}>
              Sonatta
            </div>
            <span className="text-zinc-500 text-sm hidden md:inline-block">|</span>
            <span className="text-zinc-400 font-medium hidden md:inline-block">Portal do Aluno</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-300">Olá, <strong className="text-white">{nome}</strong></span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 transition-colors text-sm font-medium"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col relative">
        {children}
      </main>
    </div>
  );
}

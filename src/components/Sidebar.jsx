import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, PlusCircle, Repeat, RotateCcw, Lightbulb } from 'lucide-react';
import AgendamentoAulaModal from './AgendamentoAulaModal'; 

export default function Sidebar({ onLogout }) { // <-- Recebe o onLogout do App aqui
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || '';
  const canalComunicacao = new BroadcastChannel('sonatta_updates');

  const nomeUsuario = localStorage.getItem('@sonatta:usuario_nome') || 'Usuário';

  // Função auxiliar para deixar o botão azul quando estiver na página ativa
  const linkStyle = ({ isActive }) => 
    `w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left font-medium transition-all ${
      isActive 
        ? 'bg-emerald-600 text-white' 
        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
    }`;

  // Estados para o Modal de Agendamento de Aula Extra
  const [isAgendamentoModalAberto, setIsAgendamentoModalAberto] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState('aula_extra');

  const handleAbrirModal = (tipo) => {
    setTipoSelecionado(tipo);
    setIsAgendamentoModalAberto(true);
  };

  const handleAgendarAulaExperimental = () => {
    navigate('/aulas-experimentais');
  };

  return (
    <>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Caveat:wght@500&display=swap');
    </style>

    <aside className="w-64 h-screen bg-white dark:bg-zinc-900 flex flex-col justify-between p-4 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto">
      <div className="flex-1 flex flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center px-2 text-center">
          <div className="text-emerald-400 text-4xl font-bold" style={{ fontFamily: "'Dancing Script', cursive" }}>
            <span>Sonatta</span>
          </div>
          {/* Nome do usuário logado */}
          <p className="text-white text-2xl" style={{ fontFamily: "'Caveat', cursive" }}>
            {nomeUsuario}
          </p>
        </div>

        {/* Links de Navegação usando NavLink */}
        <nav className="space-y-2">
          <NavLink to="/" className={linkStyle}>
            📊 Resumo
          </NavLink>
          
          <NavLink to="/alunos" className={linkStyle}>
            👥 Alunos
          </NavLink>

          <NavLink to="/professores" className={linkStyle}>
            👨🏫 Professores
          </NavLink>

          <NavLink to="/agenda" className={linkStyle}>
            📅 Agenda de Aulas
          </NavLink>
          
          <NavLink to="/financeiro" className={linkStyle}>
            💰 Financeiro
          </NavLink>

          {/* New section for special classes */}
          <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <h3 className="text-xs uppercase font-bold text-zinc-500 mb-3">Agendar Aulas Especiais</h3>
            <button onClick={() => handleAbrirModal('aula_extra')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium w-full text-left transition-colors hover:bg-emerald-600/20 text-emerald-400">
              <PlusCircle size={18} className="text-emerald-500" /> Aula Extra
            </button>
            <button onClick={() => handleAbrirModal('reagendada')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium w-full text-left transition-colors hover:bg-blue-600/20 text-blue-400">
              <Repeat size={18} className="text-blue-500" /> Reagendada
            </button>
            <button onClick={() => handleAbrirModal('reposicao')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium w-full text-left transition-colors hover:bg-red-600/20 text-red-400">
              <RotateCcw size={18} className="text-red-500" /> Reposição
            </button>
            <button onClick={handleAgendarAulaExperimental} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium w-full text-left transition-colors hover:bg-orange-600/20 text-orange-400">
              <Lightbulb size={18} className="text-orange-500" /> Experimental
            </button>
          </div>
        </nav>
      </div>

      {/* Botão Sair */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
        <button 
          onClick={onLogout} // <-- Executa diretamente a função que veio lá do App.jsx
          className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>

    <AgendamentoAulaModal
      isOpen={isAgendamentoModalAberto}
      onClose={() => setIsAgendamentoModalAberto(false)}
      tipoPadrao={tipoSelecionado}
      onSaveSuccess={() => canalComunicacao.postMessage('atualizar_dados')}
    />
    </>
  );
}
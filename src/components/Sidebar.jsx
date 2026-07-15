import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, PlusCircle, Repeat, RotateCcw, Lightbulb, X } from 'lucide-react';
import AgendamentoAulaModal from './AgendamentoAulaModal'; 

export default function Sidebar({ onLogout, tipoUsuario, professorId, isOpen, onClose }) {
  const navigate = useNavigate();

  const _envApi = import.meta.env.VITE_API_URL;
  const _defaultLocal = 'http://localhost:3005';
  const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);
  const canalComunicacao = new BroadcastChannel('sonatta_updates');

  const nomeUsuario = localStorage.getItem('@sonatta:usuario_nome') || 'Usuário';
  const ehProfessor = tipoUsuario === 'professor';

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

  const handleTrocarSenha = async (e) => {
    e.preventDefault();
    setSenhaMensagem('');

    const token = localStorage.getItem('@sonatta:token');
    try {
      const resposta = await fetch(`${API_URL}/api/auth/trocar-senha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ senhaAtual, novaSenha, confirmarNovaSenha })
      });

      let dados;
      const texto = await resposta.text();
      try {
        dados = texto ? JSON.parse(texto) : {};
      } catch (_parseErr) {
        throw new Error('Resposta inválida do servidor. Tente novamente.');
      }

      if (!resposta.ok) {
        throw new Error(dados.erro || 'Erro ao alterar senha');
      }

      setSenhaMensagem('Senha alterada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarNovaSenha('');
      setTimeout(() => setIsSenhaModalAberto(false), 900);
    } catch (erro) {
      setSenhaMensagem(erro.message);
    }
  };

  return (
    <>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Caveat:wght@500&display=swap');
    </style>

    <aside className={`fixed inset-y-0 left-0 z-50 md:static w-64 h-screen bg-white dark:bg-zinc-900 flex flex-col justify-between p-4 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="flex-1 flex flex-col gap-6">
        {/* Mobile close button */}
        <div className="md:hidden flex justify-end">
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white bg-zinc-800 rounded-md">
            <X size={24} />
          </button>
        </div>
        {/* Logo */}
        <div className="flex flex-col items-center px-2 text-center">
          <div className="text-emerald-400 text-4xl font-bold" style={{ fontFamily: "'Dancing Script', cursive" }}>
            <span>Sonatta</span>
          </div>
          {/* Nome do usuário logado */}
          <p className="text-white text-2xl" style={{ fontFamily: "'Caveat', cursive" }}>
            {nomeUsuario}
          </p>
          {ehProfessor && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1 border border-emerald-500/20">
              Professor
            </span>
          )}
        </div>

        {/* Links de Navegação */}
        <nav className="space-y-2">
          {ehProfessor ? (
            <>
              {/* Menu do Professor */}
              <NavLink to="/minha-agenda" className={linkStyle}>
                📅 Minha Agenda
              </NavLink>

              <NavLink to="/meus-recebimentos" className={linkStyle}>
                💰 Meus Recebimentos
              </NavLink>
            </>
          ) : (
            <>
              {/* Menu do Admin */}
              <NavLink to="/" className={linkStyle}>
                📊 Resumo
              </NavLink>
              
              <NavLink to="/alunos" className={linkStyle}>
                👥 Alunos
              </NavLink>

              <NavLink to="/professores" className={linkStyle}>
                👨‍🏫 Professores
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
            </>
          )}
        </nav>
      </div>

      {/* Botão Sair */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-2">
        <button 
          onClick={onLogout}
          className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>

    

    {!ehProfessor && (
      <AgendamentoAulaModal
        isOpen={isAgendamentoModalAberto}
        onClose={() => setIsAgendamentoModalAberto(false)}
        tipoPadrao={tipoSelecionado}
        onSaveSuccess={() => canalComunicacao.postMessage('atualizar_dados')}
      />
    )}
    </>
  );
}
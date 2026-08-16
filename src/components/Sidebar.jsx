import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, PlusCircle, Repeat, RotateCcw, Lightbulb, X, Folder, Settings, CreditCard, CheckSquare } from 'lucide-react';
import { FaGraduationCap, FaUserGraduate, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';
import { ChartBarIcon, UsersIcon, UserGroupIcon, AcademicCapIcon, BookOpenIcon, CalendarIcon, BanknotesIcon, MapPinIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import AgendamentoAulaModal from './AgendamentoAulaModal';

export default function Sidebar({ onLogout, tipoUsuario, isOpen, onClose }) {
  const navigate = useNavigate();

  const _envApi = import.meta.env.VITE_API_URL;
  const _defaultLocal = 'http://localhost:3005';
  const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);
  const canalComunicacao = new BroadcastChannel('sonatta_updates');

  const nomeUsuario = localStorage.getItem('@sonatta:usuario_nome') || 'Usuário';
  const escolaNome = localStorage.getItem('@sonatta:escola_nome') || '';
  const escolaLogo = localStorage.getItem('@sonatta:escola_logo') || '';
  const ehProfessor = tipoUsuario === 'professor';

  // Função auxiliar para deixar o botão azul quando estiver na página ativa
  const linkStyle = ({ isActive }) =>
    `w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left font-medium transition-all ${isActive
      ? 'bg-emerald-600 text-white'
      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
    }`;

  // Estados para o Modal de Agendamento de Aula Extra
  const [isAgendamentoModalAberto, setIsAgendamentoModalAberto] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState('aula_extra');

  // Estados para Trocar Senha
  const [isSenhaModalAberto, setIsSenhaModalAberto] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [senhaMensagem, setSenhaMensagem] = useState('');


  const handleAbrirModal = (tipo) => {
    setTipoSelecionado(tipo);
    setIsAgendamentoModalAberto(true);
    if (onClose) onClose();
  };

  const handleAgendarAulaExperimental = () => {
    navigate('/aulas-experimentais');
    if (onClose) onClose();
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
          Authorization: `Bearer ${localStorage.getItem('@sonatta:token')}`
        },
        body: JSON.stringify({ senhaAtual, novaSenha, confirmarNovaSenha })
      });

      let dados;
      const texto = await resposta.text();
      try {
        dados = texto ? JSON.parse(texto) : {};
      } catch {
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
            {escolaLogo ? (
              <img src={escolaLogo} alt={escolaNome || 'Escola'} className="max-h-16 mb-2 object-contain" />
            ) : escolaNome ? (
              <div className="text-white text-2xl font-bold mb-2">
                <span>{escolaNome}</span>
              </div>
            ) : (
              <div className="text-emerald-400 text-4xl font-bold" style={{ fontFamily: "'Dancing Script', cursive" }}>
                <span>Sonatta</span>
              </div>
            )}
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
                <NavLink to="/minhas-turmas" className={linkStyle} onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      <FaGraduationCap size={20} className={isActive ? "text-white" : "text-purple-500"} />
                      Minhas Turmas
                    </>
                  )}
                </NavLink>

                <NavLink to="/meus-alunos" className={linkStyle} onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      <FaUserGraduate size={20} className={isActive ? "text-white" : "text-emerald-500"} />
                      Meus Alunos
                    </>
                  )}
                </NavLink>

                <NavLink to="/minha-agenda" className={linkStyle} onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      <FaCalendarAlt size={20} className={isActive ? "text-white" : "text-blue-500"} />
                      Minha Agenda
                    </>
                  )}
                </NavLink>

                <NavLink to="/meus-recebimentos" className={linkStyle} onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      <FaMoneyBillWave size={20} className={isActive ? "text-white" : "text-amber-500"} />
                      Meus Recebimentos
                    </>
                  )}
                </NavLink>

                <NavLink to="/eventos" className={linkStyle} onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      <CheckSquare className={`w-5 h-5 ${isActive ? 'text-white' : 'text-teal-500'}`} />
                      Eventos & Audições
                    </>
                  )}
                </NavLink>

                <NavLink to="/materiais" className={linkStyle} onClick={onClose}>
                  <Folder size={20} />
                  Arquivos
                </NavLink>
              </>
            ) : (
              <>
                {/* Menu do Admin */}
                <NavLink to="/" className={linkStyle} onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      <ChartBarIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                      Geral
                    </>
                  )}
                </NavLink>

                <NavLink to="/relatorios" className={linkStyle} onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      <ChartBarIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                      Relatórios (BI)
                    </>
                  )}
                </NavLink>

                <NavLink to="/alunos" className={linkStyle} onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      <UsersIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-emerald-500'}`} />
                      Alunos
                    </>
                  )}
                </NavLink>

                <NavLink to="/responsaveis" className={linkStyle} onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      <UserGroupIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-orange-500'}`} />
                      Responsáveis
                    </>
                  )}
                </NavLink>

                <NavLink to="/professores" className={linkStyle} onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      <AcademicCapIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-purple-500'}`} />
                      Professores
                    </>
                  )}
                </NavLink>

                <NavLink to="/cursos-turmas" className={linkStyle} onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      <BookOpenIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-pink-500'}`} />
                      Cursos e Turmas
                    </>
                  )}
                </NavLink>

                <NavLink to="/salas" className={linkStyle} onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      <MapPinIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-rose-500'}`} />
                      Salas Físicas
                    </>
                  )}
                </NavLink>

                <NavLink to="/locacao-salas" className={linkStyle} onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      <svg className={`w-5 h-5 ${isActive ? 'text-white' : 'text-rose-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      Locação de Salas
                    </>
                  )}
                </NavLink>

                <NavLink to="/agenda" className={linkStyle} onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      <CalendarIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-indigo-500'}`} />
                      Agenda de Aulas
                    </>
                  )}
                </NavLink>

                <NavLink to="/financeiro" className={linkStyle} onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      <BanknotesIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-amber-500'}`} />
                      Financeiro
                    </>
                  )}
                </NavLink>

                <NavLink to="/lojinha" className={linkStyle} onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      <ShoppingCartIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-amber-500'}`} />
                      Lojinha (PDV)
                    </>
                  )}
                </NavLink>

                <NavLink to="/eventos" className={linkStyle} onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      <CheckSquare className={`w-5 h-5 ${isActive ? 'text-white' : 'text-teal-500'}`} />
                      Eventos & Audições
                    </>
                  )}
                </NavLink>

                <NavLink to="/materiais" className={linkStyle} onClick={onClose}>
                  <Folder size={20} />
                  Arquivos
                </NavLink>

                <NavLink to="/configuracoes" className={linkStyle} onClick={onClose}>
                  <Settings size={20} />
                  Configurações
                </NavLink>

                <NavLink to="/feriados" className={linkStyle} onClick={onClose}>
                  <CalendarIcon className="w-5 h-5" />
                  Feriados
                </NavLink>

                <NavLink to="/minha-assinatura" className={linkStyle} onClick={onClose}>
                  <CreditCard size={20} />
                  Minha Assinatura
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
          {ehProfessor && (
            <button
              onClick={() => setIsSenhaModalAberto(true)}
              className="w-full px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-300 hover:text-white rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2 mb-2"
            >
              <Settings size={16} />
              Trocar Senha
            </button>
          )}
          
          <button
            onClick={onLogout}
            className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-lg font-medium transition-all text-sm flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Sair
          </button>
          
          {(escolaNome || escolaLogo) && (
            <div className="text-center mt-4">
              <span className="text-[10px] text-emerald-500 font-medium tracking-widest uppercase">Powered by Sonatta</span>
            </div>
          )}
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

      {/* Modal Trocar Senha */}
      {isSenhaModalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings size={20} className="text-emerald-500" />
                Trocar Senha
              </h2>
              <button onClick={() => setIsSenhaModalAberto(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleTrocarSenha} className="p-6 space-y-4">
              {senhaMensagem && (
                <div className={`p-3 rounded-lg text-sm font-medium ${senhaMensagem.includes('sucesso') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {senhaMensagem}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Senha Atual</label>
                <input
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  required
                  placeholder="Sua senha atual"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Nova Senha</label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required
                  placeholder="Nova senha"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmarNovaSenha}
                  onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                  required
                  placeholder="Repita a nova senha"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors mt-2"
              >
                Atualizar Senha
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

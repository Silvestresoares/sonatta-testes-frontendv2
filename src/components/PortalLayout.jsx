import React, { useState } from 'react';
import { LogOut, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

export default function PortalLayout({ children }) {
  const navigate = useNavigate();
  const nome = localStorage.getItem('@sonatta:portal_nome') || 'Usuário';
  const token = localStorage.getItem('@sonatta:portal_token');

  const [modalAberto, setModalAberto] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [mensagemSenha, setMensagemSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('@sonatta:portal_token');
    localStorage.removeItem('@sonatta:portal_nome');
    localStorage.removeItem('@sonatta:portal_tipo');
    navigate('/portal/login');
  };

  const handleTrocarSenha = async (e) => {
    e.preventDefault();
    setMensagemSenha('');
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/api/portal/trocar-senha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ senhaAtual, novaSenha })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao trocar senha');
      setMensagemSenha('Senha atualizada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setTimeout(() => setModalAberto(false), 2000);
    } catch (err) {
      setMensagemSenha(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-black relative">
      
      {/* Imagem de Fundo e Overlay */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-slow-pan opacity-35"
          style={{ backgroundImage: "url('/login-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/90 via-zinc-950/70 to-zinc-950/90" />
      </div>

      <style>
        {`
          @keyframes slowPan {
            0% { transform: scale(1.0) translate(0, 0); }
            50% { transform: scale(1.05) translate(-1%, 0); }
            100% { transform: scale(1.0) translate(0, 0); }
          }
          .animate-slow-pan {
            animation: slowPan 35s ease-in-out infinite;
          }
        `}
      </style>

      {/* Navbar simplificada para o portal */}
      <header className="bg-zinc-900/60 backdrop-blur-md border-b border-zinc-800/50 p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-emerald-400 text-3xl font-bold" style={{ fontFamily: "'Dancing Script', cursive" }}>
              Sonatta
            </div>
            <span className="text-zinc-500 text-sm hidden md:inline-block">|</span>
            <span className="text-zinc-400 font-medium hidden md:inline-block shadow-sm">Portal do Aluno</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-300 hidden sm:inline-block">Olá, <strong className="text-white">{nome}</strong></span>
            
            <button 
              onClick={() => {
                setModalAberto(true);
                setMensagemSenha('');
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 backdrop-blur-sm text-zinc-300 transition-colors text-sm font-medium border border-zinc-700/50"
            >
              <KeyRound size={16} />
              <span className="hidden sm:inline">Alterar Senha</span>
            </button>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-red-500/20 hover:text-red-400 backdrop-blur-sm text-zinc-400 transition-colors text-sm font-medium border border-zinc-700/50 hover:border-red-500/30"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col relative z-10">
        {children}
      </main>

      {/* Modal de Troca de Senha */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="text-emerald-500" size={20} />
                Alterar Senha
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-zinc-400 hover:text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleTrocarSenha} className="p-6 space-y-4">
              {mensagemSenha && (
                <div className={`p-3 rounded-lg text-sm font-medium ${mensagemSenha.includes('sucesso') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {mensagemSenha}
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
              <button 
                type="submit" 
                disabled={carregando}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors mt-2"
              >
                {carregando ? 'Atualizando...' : 'Atualizar Senha'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

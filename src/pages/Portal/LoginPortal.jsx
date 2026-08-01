import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ArrowRight } from 'lucide-react';
import EsqueciSenhaPortal from './EsqueciSenhaPortal';
import RedefinirSenhaPortal from './RedefinirSenhaPortal';

// Depende apenas de variáveis de ambiente configuradas no build/Docker
const API_URL = import.meta.env.VITE_API_URL || '';

export default function LoginPortal() {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [telaAtual, setTelaAtual] = useState('painel'); // 'painel', 'esqueci', 'redefinir'
  const navigate = useNavigate();

  // 🕵️ Captura automática se o usuário veio pelo link do e-mail (?token=...)
  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    if (parametros.has('token')) {
      setTelaAtual('redefinir');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const res = await fetch(`${API_URL}/api/portal/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, senha })
      });

      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro || 'Erro ao fazer login');

      // O token JWT agora é retido exclusivamente pelo navegador (HttpOnly Cookie)
      // localStorage.setItem('@sonatta:portal_token', dados.token); // <-- Removido para segurança
      localStorage.setItem('@sonatta:portal_nome', dados.usuario.nome);
      localStorage.setItem('@sonatta:portal_tipo', dados.usuario.tipo_usuario);
      
      if (dados.escola) {
        localStorage.setItem('@sonatta:portal_escola_nome', dados.escola.nome || '');
        localStorage.setItem('@sonatta:portal_escola_logo', dados.escola.logo || '');
      }
      
      navigate('/portal/dashboard');
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row font-sans selection:bg-emerald-500 selection:text-black">
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');`}
      </style>

      {/* Lado Esquerdo - Decorativo */}
      <div className="hidden md:flex md:w-1/2 bg-emerald-900/20 relative items-center justify-center overflow-hidden border-r border-emerald-900/30">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-zinc-950/90 z-10" />
        <div className="relative z-20 text-center px-8">
          <div className="text-emerald-400 text-7xl font-bold mb-4 drop-shadow-lg" style={{ fontFamily: "'Dancing Script', cursive" }}>
            Sonatta
          </div>
          <p className="text-zinc-300 text-xl font-medium tracking-wide">
            Portal do Aluno e Responsável
          </p>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        
        {telaAtual === 'esqueci' && (
          <EsqueciSenhaPortal aoVoltar={() => setTelaAtual('painel')} />
        )}
        
        {telaAtual === 'redefinir' && (
          <RedefinirSenhaPortal aoSucesso={() => setTelaAtual('painel')} />
        )}

        {telaAtual === 'painel' && (
          <div className="w-full max-w-md bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 shadow-2xl backdrop-blur-sm">
            <div className="md:hidden text-center mb-8">
               <div className="text-emerald-400 text-5xl font-bold mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>
                Sonatta
              </div>
              <p className="text-zinc-400 font-medium">Portal do Aluno</p>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo(a) de volta!</h2>
            <p className="text-zinc-400 mb-8">Faça login para ver sua agenda, histórico e pagamentos.</p>

            <form onSubmit={handleLogin} className="space-y-5">
              {erro && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm font-medium">
                  {erro}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">CPF ou E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    placeholder="Digite seu e-mail ou CPF..."
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-zinc-400">Senha</label>
                  <button 
                    type="button"
                    onClick={() => setTelaAtual('esqueci')}
                    className="text-xs text-emerald-500 hover:text-emerald-400 font-medium transition-colors cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    placeholder="Sua senha de acesso"
                    required
                  />
                </div>
                <div className="text-xs text-zinc-500 mt-2 text-right">
                  Primeiro acesso? Use a senha padrão <strong className="text-zinc-300">sonatta123</strong>
                </div>
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {carregando ? 'Entrando...' : 'Entrar no Portal'}
                {!carregando && <ArrowRight size={18} />}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full text-center text-sm text-zinc-400 hover:text-white transition-colors mt-4"
              >
                Voltar para Área Administrativa
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

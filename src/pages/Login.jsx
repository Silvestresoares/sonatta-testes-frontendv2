import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';
// 📦 Importação das novas telas isoladas
import EsqueciSenha from './EsqueciSenha';
import RedefinirSenha from './RedefinirSenha';

// Detecta a URL da internet ou usa o localhost se estiver testando no computador

export default function Login({ aoLogar }) {
  // 🔌 Controla se exibe o login/cadastro padrão ou as telas novas de recuperação
  const [telaAtual, setTelaAtual] = useState('painel'); // 'painel', 'esqueci', 'redefinir'

  
  // Estado para o modal de imagens de propaganda
  const [imagemAberta, setImagemAberta] = useState(null);
  
  // Estados para Login
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');



  // 🕵️ Captura automática se o usuário veio pelo link do e-mail (?token=...)
  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    if (parametros.has('token')) {
      setTelaAtual('redefinir');
    }
  }, []);

  // Submissão do Login (Ajustado para bater com /api/login unificado)
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!emailLogin || !senhaLogin) {
      return alert("Preencha todos os campos!");
    }

    try {
      const resposta = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLogin, senha: senhaLogin })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        const usuarioLogado = dados.usuario || {};
        localStorage.setItem('@sonatta:token', dados.token);
        localStorage.setItem('@sonatta:usuario_nome', usuarioLogado.nome || 'Usuário');
        localStorage.setItem('@sonatta:tipo_usuario', usuarioLogado.tipo_usuario || 'admin');
        localStorage.setItem('@sonatta:professor_id', usuarioLogado.professor_id || '');
        localStorage.setItem('@sonatta:is_super_admin', usuarioLogado.is_super_admin || false);
        localStorage.setItem('@sonatta:plano', usuarioLogado.plano || 'Vitalicio');
        localStorage.setItem('@sonatta:ativa', usuarioLogado.ativa !== false ? 'true' : 'false');
        localStorage.setItem('@sonatta:data_vencimento', usuarioLogado.data_vencimento_assinatura || '');
        localStorage.setItem('@sonatta:escola_nome', usuarioLogado.nome_escola || '');
        localStorage.setItem('@sonatta:escola_logo', usuarioLogado.logo_url || '');
        alert(`Bem-vindo de volta, ${usuarioLogado.nome || 'Usuário'}!`);
        if (aoLogar) aoLogar(usuarioLogado);
      } else {
        alert(dados.erro || "Erro ao fazer login. Verifique suas credenciais.");
      }
    } catch (erro) {
      console.error("Erro na requisição de login:", erro);
      alert("Não foi possível conectar ao servidor.");
    }
  };



  // 🔀 RENDERIZAÇÃO CONDICIONAL
  if (telaAtual === 'esqueci') {
    return <EsqueciSenha aoVoltar={() => setTelaAtual('painel')} />;
  }

  if (telaAtual === 'redefinir') {
    return <RedefinirSenha aoSucesso={() => setTelaAtual('painel')} />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-zinc-950 text-white selection:bg-emerald-500 selection:text-black">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        {`
          @keyframes slowPan {
            0% { transform: scale(1.0) translate(0, 0); }
            50% { transform: scale(1.05) translate(-1%, 0); }
            100% { transform: scale(1.0) translate(0, 0); }
          }
          .animate-slow-pan {
            animation: slowPan 25s ease-in-out infinite;
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
        `}
      </style>

      {/* Lado Esquerdo - Imagem e Branding (Oculto no Mobile) */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-zinc-950 items-center justify-center">
        {/* Imagem de Fundo (gerada pela IA) com movimento contínuo */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-slow-pan"
          style={{ backgroundImage: "url('/login-bg.png')" }}
        />
        {/* Overlay Escuro/Gradiente para dar contraste premium */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/60 to-zinc-950/90" />
        
        {/* Conteúdo sobre a imagem */}
        <div className="relative z-10 flex flex-col items-start p-16 max-w-2xl animate-in fade-in slide-in-from-left-8 duration-1000 fill-mode-both delay-300">
          <div className="flex items-center mb-6">
            <a href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-6xl font-bold text-white tracking-tight" style={{ fontFamily: "'Dancing Script', cursive" }}>Sonatta</h1>
            </a>
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4 animate-float">
            Gestão moderna para<br/><span className="text-emerald-400">escolas de música.</span>
          </h2>
          <p className="text-lg text-zinc-300 font-medium leading-relaxed max-w-md">
            Centralize suas turmas, pagamentos e alunos em uma única plataforma feita por músicos, para músicos.
          </p>

          {/* Botões de Propaganda (Imagens do Sistema) */}
          <div className="mt-8 flex flex-wrap gap-3">
            <button 
              onClick={() => setImagemAberta('/print_dashboard.png')}
              className="px-4 py-2 bg-zinc-900/50 hover:bg-emerald-500/90 border border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-all shadow-lg backdrop-blur-sm flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              Dashboard
            </button>
            <button 
              onClick={() => setImagemAberta('/print_alunos.png')}
              className="px-4 py-2 bg-zinc-900/50 hover:bg-emerald-500/90 border border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-all shadow-lg backdrop-blur-sm flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Alunos
            </button>
            <button 
              onClick={() => setImagemAberta('/print_professores.png')}
              className="px-4 py-2 bg-zinc-900/50 hover:bg-emerald-500/90 border border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-all shadow-lg backdrop-blur-sm flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Professores
            </button>
            <button 
              onClick={() => setImagemAberta('/print_cursos.png')}
              className="px-4 py-2 bg-zinc-900/50 hover:bg-emerald-500/90 border border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-all shadow-lg backdrop-blur-sm flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
              Cursos
            </button>
            <button 
              onClick={() => setImagemAberta('/print_financeiro.png')}
              className="px-4 py-2 bg-zinc-900/50 hover:bg-emerald-500/90 border border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-all shadow-lg backdrop-blur-sm flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              Financeiro
            </button>
            <button 
              onClick={() => setImagemAberta('/print_portal.png')}
              className="px-4 py-2 bg-zinc-900/50 hover:bg-emerald-500/90 border border-zinc-700 hover:border-emerald-400 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-all shadow-lg backdrop-blur-sm flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><circle cx="12" cy="10" r="3"></circle></svg>
              Portal do Aluno
            </button>
          </div>
        </div>
      </div>

      {/* Lado Direito - Painel de Login e Ações */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-6 sm:p-12 relative min-h-screen lg:min-h-0 bg-zinc-950">
        
        {/* Botão Superior para Área do Aluno */}
        <div className="absolute top-6 right-6 lg:top-8 lg:right-10 w-full flex justify-end px-6 lg:px-0 animate-in fade-in slide-in-from-top-4 duration-700 fill-mode-both delay-500">
          <button
            onClick={() => window.location.href = '/portal/login'}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full text-sm font-medium transition-all group shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 group-hover:scale-110 transition-transform"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Sou Aluno ou Responsável
          </button>
        </div>

        {/* Branding Mobile Apenas */}
        <div className="lg:hidden text-center mb-10 mt-16">
          <a href="/" className="hover:opacity-80 transition-opacity inline-block">
            <h1 className="text-5xl font-bold text-white tracking-tight" style={{ fontFamily: "'Dancing Script', cursive" }}>Sonatta</h1>
          </a>
        </div>

        {/* Formulários Container */}
        <div className="w-full max-w-[420px] lg:mt-0 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both delay-300">
          
          <div className="mb-8">
            <h3 className="text-3xl font-bold text-white mb-2">Acesse sua conta</h3>
            <p className="text-sm text-zinc-400">Insira suas credenciais para gerenciar sua escola.</p>
          </div>

          {/* Formulário de Login */}
            <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <label className="block text-[13px] font-semibold text-zinc-300 uppercase tracking-wide mb-2">E-mail de acesso</label>
                <input 
                  type="email" 
                  required 
                  placeholder="seu-email@exemplo.com"
                  value={emailLogin} 
                  onChange={e => setEmailLogin(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-zinc-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[13px] font-semibold text-zinc-300 uppercase tracking-wide">Senha</label>
                  <button 
                    type="button"
                    onClick={() => setTelaAtual('esqueci')}
                    className="text-xs text-emerald-500 hover:text-emerald-400 font-medium transition-colors cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  value={senhaLogin} 
                  onChange={e => setSenhaLogin(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-zinc-600"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-xl text-[15px] transition-all shadow-lg hover:shadow-emerald-500/25 mt-2"
              >
                Entrar no Sistema
              </button>
            </form>


        </div>
        
        {/* Footer */}
        <p className="absolute bottom-6 text-zinc-600 text-xs text-center max-w-xs px-4">
          Ambiente seguro. Os dados da sua escola são isolados.
        </p>
      </div>
      
      {/* Modal de Imagem (Propaganda) */}
      {imagemAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setImagemAberta(null)}>
          <button 
            className="absolute top-6 right-6 text-white hover:text-emerald-400 transition-colors"
            onClick={() => setImagemAberta(null)}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <img 
            src={imagemAberta} 
            alt="Demonstração do Sistema" 
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl border border-zinc-800 blur-[2px] transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

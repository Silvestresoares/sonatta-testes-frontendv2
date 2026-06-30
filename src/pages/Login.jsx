import React, { useState, useEffect } from 'react';
// 📦 Importação das novas telas isoladas
import EsqueciSenha from './EsqueciSenha';
import RedefinirSenha from './RedefinirSenha';

// Detecta a URL da internet ou usa o localhost se estiver testando no computador
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Login({ aoLogar }) {
  // 🔌 Controla se exibe o login/cadastro padrão ou as telas novas de recuperação
  const [telaAtual, setTelaAtual] = useState('painel'); // 'painel', 'esqueci', 'redefinir'
  const [aba, setAba] = useState('login'); // 'login' ou 'cadastro'
  
  // Estados para Login
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');

  // Estados para Cadastro de Nova Escola + Administrador
  const [nomeEscola, setNomeEscola] = useState('');
  const [emailCadastro, setEmailCadastro] = useState('');
  const [senhaCadastro, setSenhaCadastro] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

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
        localStorage.setItem('@sonatta:token', dados.token);
        localStorage.setItem('@sonatta:usuario_nome', dados.usuario?.nome || 'Administrador');
        localStorage.setItem('@sonatta:tipo_usuario', dados.usuario?.tipo_usuario || 'admin');
        localStorage.setItem('@sonatta:professor_id', dados.usuario?.professor_id || '');
        alert(`Bem-vindo de volta, ${dados.usuario?.nome || 'Administrador'}!`);
        if (aoLogar) aoLogar();
      } else {
        alert(dados.erro || "Erro ao fazer login. Verifique suas credenciais.");
      }
    } catch (erro) {
      console.error("Erro na requisição de login:", erro);
      alert("Não foi possível conectar ao servidor.");
    }
  };

  // Submissão do Cadastro Unificado (Mapeado exatamente para /api/registrar)
  const handleCadastro = async (e) => {
    e.preventDefault();

    if (!nomeEscola || !emailCadastro || !senhaCadastro) {
      return alert("Preencha todos os campos obrigatórios!");
    }

    if (senhaCadastro !== confirmarSenha) {
      return alert("As senhas não coincidem!");
    }

    try {
      const resposta = await fetch(`${API_URL}/api/auth/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nome_escola: nomeEscola,
          nome: nomeEscola,
          email: emailCadastro, 
          senha: senhaCadastro 
        })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        alert("Escola cadastrada com sucesso! Agora você já pode fazer login.");
        setNomeEscola(''); setEmailCadastro(''); setSenhaCadastro(''); setConfirmarSenha('');
        setAba('login');
      } else {
        alert(dados.erro || "Erro ao cadastrar escola.");
      }
    } catch (erro) {
      console.error("Erro na requisição de cadastro:", erro);
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
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center p-4 selection:bg-emerald-500 selection:text-black">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
      </style>

      {/* Logo / Nome do Sistema */}
      <div className="mb-8 text-center">
        <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 py-2" 
            style={{ fontFamily: "'Dancing Script', cursive" }}>
          Sonatta
        </h1>
        <p className="text-xs uppercase tracking-widest text-zinc-500 mt-1">Sistema de Gestão Musical</p>
      </div>

      {/* Card Principal */}
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Seletor de Abas */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50">
          <button 
            type="button"
            onClick={() => setAba('login')}
            className={`flex-1 py-3 text-sm font-semibold transition-all cursor-pointer ${aba === 'login' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-zinc-950/40' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Acessar Conta
          </button>
          <button 
            type="button"
            onClick={() => setAba('cadastro')}
            className={`flex-1 py-3 text-sm font-semibold transition-all cursor-pointer ${aba === 'cadastro' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-zinc-950/40' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Nova Escola
          </button>
        </div>

        {/* Formulário de Login */}
        {aba === 'login' && (
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">E-mail do Administrador</label>
              <input 
                type="email" 
                required 
                placeholder="seu-email@exemplo.com"
                value={emailLogin} 
                onChange={e => setEmailLogin(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-all placeholder-zinc-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-zinc-400 uppercase">Senha</label>
                <button 
                  type="button"
                  onClick={() => setTelaAtual('esqueci')}
                  className="text-[11px] text-zinc-500 hover:text-emerald-400 normal-case font-medium transition-colors cursor-pointer"
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-all placeholder-zinc-600"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition-all shadow-lg cursor-pointer mt-2"
            >
              Entrar no Sistema
            </button>
          </form>
        )}

        {/* Formulário de Cadastro */}
        {aba === 'cadastro' && (
          <form onSubmit={handleCadastro} className="p-6 space-y-4">
            
            <div className="border-b border-zinc-800 pb-2 mb-2">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Cadastro Administrativo</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Nome da Escola / Admin *</label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Conservatório Sonatta"
                value={nomeEscola} 
                onChange={e => setNomeEscola(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-all placeholder-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">E-mail de Login *</label>
              <input 
                type="email" 
                required 
                placeholder="adm@escola.com"
                value={emailCadastro} 
                onChange={e => setEmailCadastro(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-all placeholder-zinc-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Senha *</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  value={senhaCadastro} 
                  onChange={e => setSenhaCadastro(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-all placeholder-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Confirmar *</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  value={confirmarSenha} 
                  onChange={e => setConfirmarSenha(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-all placeholder-zinc-600"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition-all shadow-lg cursor-pointer mt-4"
            >
              Criar Escola e Administrador
            </button>
          </form>
        )}

      </div>
      
      <p className="text-zinc-600 text-xs mt-6 text-center max-w-xs">
        Ambiente protegido por criptografia JWT. Os dados das escolas são completamente isolados.
      </p>
    </div>
  );
}
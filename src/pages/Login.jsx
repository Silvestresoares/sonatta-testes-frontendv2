import React, { useState, useEffect } from 'react';
// 📦 Importação das novas telas isoladas
import EsqueciSenha from './EsqueciSenha';
import RedefinirSenha from './RedefinirSenha';

// Detecta a URL da internet ou usa o localhost se estiver testando no computador
const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

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
  const [telefoneCadastro, setTelefoneCadastro] = useState('');
  const [documentoCadastro, setDocumentoCadastro] = useState('');
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
        const usuarioLogado = dados.usuario || {};
        localStorage.setItem('@sonatta:token', dados.token);
        localStorage.setItem('@sonatta:usuario_nome', usuarioLogado.nome || 'Usuário');
        localStorage.setItem('@sonatta:tipo_usuario', usuarioLogado.tipo_usuario || 'admin');
        localStorage.setItem('@sonatta:professor_id', usuarioLogado.professor_id || '');
        localStorage.setItem('@sonatta:is_super_admin', usuarioLogado.is_super_admin || false);
        localStorage.setItem('@sonatta:plano', usuarioLogado.plano || 'Vitalicio');
        localStorage.setItem('@sonatta:data_vencimento', usuarioLogado.data_vencimento_assinatura || '');
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
          telefone_comercial: telefoneCadastro,
          documento: documentoCadastro,
          email: emailCadastro, 
          senha: senhaCadastro 
        })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        alert("Escola cadastrada com sucesso! Agora você já pode fazer login.");
        setNomeEscola(''); setEmailCadastro(''); setTelefoneCadastro(''); setDocumentoCadastro(''); setSenhaCadastro(''); setConfirmarSenha('');
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
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">E-mail de acesso</label>
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

            <p className="text-[11px] text-zinc-500 text-center">Use o e-mail cadastrado para professor ou administrador.</p>

            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition-all shadow-lg cursor-pointer mt-2"
            >
              Entrar no Sistema
            </button>
            <div className="pt-4 mt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => window.location.href = '/portal/login'}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold py-2.5 rounded-lg text-sm transition-all cursor-pointer border border-zinc-700 hover:border-emerald-500/50"
              >
                Sou Aluno ou Responsável
              </button>
            </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Telefone de Contato</label>
                <input 
                  type="text" 
                  placeholder="(00) 00000-0000"
                  value={telefoneCadastro} 
                  onChange={e => {
                  let v = e.target.value.replace(/\D/g, '');
                  if (v.length > 11) v = v.substring(0, 11);
                  if (v.length > 10) {
                    v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
                  } else if (v.length > 6) {
                    v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
                  } else if (v.length > 2) {
                    v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
                  }
                  setTelefoneCadastro(v);
                }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-all placeholder-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">CPF ou CNPJ</label>
                <input 
                  type="text" 
                  placeholder="Apenas números"
                  value={documentoCadastro} 
                  onChange={e => {
                  let v = e.target.value.replace(/\D/g, '');
                  if (v.length > 14) v = v.substring(0, 14);
                  
                  if (v.length <= 11) {
                    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
                    else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
                  } else {
                    if (v.length > 12) v = v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                    else if (v.length > 8) v = v.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
                    else if (v.length > 5) v = v.replace(/(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
                    else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,3})/, '$1.$2');
                  }
                  setDocumentoCadastro(v);
                }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-all placeholder-zinc-600"
                />
              </div>
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

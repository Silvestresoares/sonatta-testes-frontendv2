import React, { useState, useEffect } from 'react';


import { API_URL } from '../../utils/api';
export default function RedefinirSenhaPortal({ aoSucesso }) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [token, setToken] = useState('');
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    // Captura o token diretamente da URL (?token=XXXX)
    const parametros = new URLSearchParams(window.location.search);
    const tokenUrl = parametros.get('token');
    if (tokenUrl) {
      setToken(tokenUrl);
    } else {
      setMensagem({ tipo: 'erro', texto: 'Token de recuperação inválido ou ausente.' });
    }
  }, []);

  const handleSubmeter = async (e) => {
    e.preventDefault();
    
    if (novaSenha !== confirmarSenha) {
      setMensagem({ tipo: 'erro', texto: 'As senhas não coincidem.' });
      return;
    }

    if (novaSenha.length < 6) {
      setMensagem({ tipo: 'erro', texto: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      const resposta = await fetch(`${API_URL}/api/portal/redefinir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Senha redefinida com sucesso! Redirecionando...' });
        setTimeout(() => {
          // Limpa os parâmetros da URL e volta para o login limpo
          window.history.replaceState({}, document.title, window.location.pathname);
          aoSucesso();
        }, 3000);
      } else {
        setMensagem({ tipo: 'erro', texto: dados.erro || 'Erro ao redefinir senha.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Não foi possível conectar ao servidor.' });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 shadow-2xl backdrop-blur-sm mx-auto z-10 relative">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-400 mb-2">Nova Senha</h2>
        <p className="text-sm text-zinc-400">Crie uma nova senha segura para acessar o portal.</p>
      </div>

      {mensagem.texto && (
        <div className={`p-3 rounded-lg text-sm text-center font-medium mb-4 ${
          mensagem.tipo === 'sucesso' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {mensagem.texto}
        </div>
      )}

      {token && (
        <form onSubmit={handleSubmeter} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Nova Senha</label>
            <input 
              type="password" 
              required
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="******"
              className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Confirmar Nova Senha</label>
            <input 
              type="password" 
              required
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="******"
              className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={carregando}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl transition-all font-medium mt-4 cursor-pointer"
          >
            {carregando ? 'Alterando...' : 'Redefinir Senha'}
          </button>
        </form>
      )}
    </div>
  );
}

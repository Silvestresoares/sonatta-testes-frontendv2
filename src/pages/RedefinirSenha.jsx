import React, { useState, useEffect } from 'react';

const API_URL = 'https://sonatta-backend.onrender.com';

export default function RedefinirSenha({ aoSucesso }) {
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
      const resposta = await fetch(`${API_URL}/api/recuperacao/redefinir-senha`, {
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
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: 'Não foi possível conectar ao servidor.' });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-emerald-400">Nova Senha</h2>
          <p className="text-xs text-zinc-400 mt-2">Crie uma nova senha segura para acessar o sistema.</p>
        </div>

        {mensagem.texto && (
          <div className={`p-3 rounded-lg text-sm text-center font-medium ${
            mensagem.tipo === 'sucesso' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {mensagem.texto}
          </div>
        )}

        {token && (
          <form onSubmit={handleSubmeter} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Nova Senha</label>
              <input 
                type="password" 
                required
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="******"
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Confirmar Nova Senha</label>
              <input 
                type="password" 
                required
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="******"
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button 
              type="submit"
              disabled={carregando}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg cursor-pointer"
            >
              {carregando ? 'Alterando...' : 'Redefinir Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

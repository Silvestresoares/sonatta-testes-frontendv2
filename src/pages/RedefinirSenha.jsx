import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_URL } from '../utils/api';

export default function RedefinirSenha({ aoSucesso }) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
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
      setMensagem({ tipo: 'erro', texto: 'Link de criação/redefinição de senha inválido ou expirado.' });
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
        setMensagem({ tipo: 'sucesso', texto: 'Senha cadastrada com sucesso! Redirecionando para o login...' });
        setTimeout(() => {
          // Limpa os parâmetros da URL e vai para o login
          window.history.replaceState({}, document.title, window.location.pathname);
          if (typeof aoSucesso === 'function') {
            aoSucesso();
          } else {
            window.location.href = '/login';
          }
        }, 2000);
      } else {
        setMensagem({ tipo: 'erro', texto: dados.erro || 'Erro ao definir senha. O link pode ter expirado.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Não foi possível conectar ao servidor.' });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-white selection:bg-emerald-500 selection:text-black">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Lock size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Criar Nova Senha</h2>
          <p className="text-xs text-zinc-400">Defina uma senha segura para acessar a plataforma Sonatta.</p>
        </div>

        {mensagem.texto && (
          <div className={`p-3.5 rounded-xl text-sm flex items-center gap-2.5 font-medium ${
            mensagem.tipo === 'sucesso' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {mensagem.tipo === 'sucesso' ? <CheckCircle2 size={18} className="flex-shrink-0" /> : <AlertCircle size={18} className="flex-shrink-0" />}
            <span>{mensagem.texto}</span>
          </div>
        )}

        {token ? (
          <form onSubmit={handleSubmeter} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">Nova Senha</label>
              <div className="relative">
                <input 
                  type={mostrarSenha ? "text" : "password"}
                  required
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">Confirmar Nova Senha</label>
              <div className="relative">
                <input 
                  type={mostrarConfirmar ? "text" : "password"}
                  required
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {mostrarConfirmar ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={carregando}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-98"
            >
              {carregando ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </form>
        ) : (
          <div className="text-center pt-2">
            <a 
              href="/login" 
              className="inline-block px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-zinc-200 rounded-xl transition-all"
            >
              Voltar ao Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

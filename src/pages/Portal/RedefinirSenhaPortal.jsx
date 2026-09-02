import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { API_URL } from '../../utils/api';

export default function RedefinirSenhaPortal({ aoSucesso }) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [token, setToken] = useState('');
  const [tokenValido, setTokenValido] = useState(null); // null = validando, true = ok, false = invalido
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    // Captura o token diretamente da URL (?token=XXXX)
    const parametros = new URLSearchParams(window.location.search);
    const tokenUrl = parametros.get('token');
    
    if (tokenUrl) {
      setToken(tokenUrl);
      validarToken(tokenUrl);
    } else {
      setTokenValido(false);
      setMensagem({ 
        tipo: 'erro', 
        texto: 'Link de criação de senha não encontrado ou incompleto.' 
      });
    }
  }, []);

  const validarToken = async (tokenParaValidar) => {
    try {
      const resposta = await fetch(`${API_URL}/api/portal/validar-token-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenParaValidar })
      });
      const dados = await resposta.json();

      if (resposta.ok) {
        setTokenValido(true);
      } else {
        setTokenValido(false);
        setMensagem({
          tipo: 'erro',
          texto: dados.erro || 'Este link de acesso é inválido, expirou ou já foi utilizado.'
        });
      }
    } catch {
      // Se houver instabilidade de rede temporária, permite tentar submeter normalmente
      setTokenValido(true);
    }
  };

  const handleSubmeter = async (e) => {
    e.preventDefault();
    
    if (novaSenha !== confirmarSenha) {
      setMensagem({ tipo: 'erro', texto: 'As senhas digitadas não coincidem.' });
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
        setTokenValido(false); // Invalida visualmente para impedir reenvios
        setMensagem({ tipo: 'sucesso', texto: 'Senha cadastrada com sucesso! Redirecionando para o login...' });
        setTimeout(() => {
          // Limpa os parâmetros da URL e volta para o login limpo
          window.history.replaceState({}, document.title, window.location.pathname);
          if (typeof aoSucesso === 'function') {
            aoSucesso();
          } else {
            window.location.href = '/portal/login';
          }
        }, 2000);
      } else {
        setMensagem({ tipo: 'erro', texto: dados.erro || 'Erro ao redefinir senha.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Não foi possível conectar ao servidor. Tente novamente.' });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-zinc-900/90 p-8 rounded-2xl border border-zinc-800 shadow-2xl backdrop-blur-sm mx-auto z-10 relative">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Lock size={22} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Criar Senha de Acesso</h2>
        <p className="text-xs text-zinc-400">Portal do Aluno e da Família Sonatta</p>
      </div>

      {mensagem.texto && (
        <div className={`p-4 rounded-xl text-sm font-medium mb-4 flex items-start gap-2.5 ${
          mensagem.tipo === 'sucesso' 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {mensagem.tipo === 'sucesso' ? (
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
          )}
          <span>{mensagem.texto}</span>
        </div>
      )}

      {tokenValido === false && mensagem.tipo === 'erro' && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              window.history.replaceState({}, document.title, window.location.pathname);
              if (typeof aoSucesso === 'function') {
                aoSucesso();
              } else {
                window.location.href = '/portal/login';
              }
            }}
            className="inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
          >
            Ir para a tela de Login <ArrowRight size={14} />
          </button>
        </div>
      )}

      {tokenValido === true && (
        <form onSubmit={handleSubmeter} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">Nova Senha</label>
            <input 
              type="password" 
              required
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
              className="w-full px-4 py-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">Confirmar Nova Senha</label>
            <input 
              type="password" 
              required
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Digite a senha novamente"
              className="w-full px-4 py-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={carregando}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl transition-all font-semibold text-sm mt-4 cursor-pointer shadow-lg shadow-emerald-950/40"
          >
            {carregando ? 'Salvando Senha...' : 'Salvar Senha e Acessar'}
          </button>
        </form>
      )}
    </div>
  );
}
